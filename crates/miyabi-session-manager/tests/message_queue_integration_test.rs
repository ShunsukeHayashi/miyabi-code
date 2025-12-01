//! Integration tests for message queue system

use miyabi_session_manager::{LogMessage, Message, MessageBuilder, MessageType, Priority, SessionManager};
use tempfile::tempdir;
use uuid::Uuid;

#[tokio::test]
async fn test_message_queue_basic_flow() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path())
        .await
        .unwrap()
        .with_message_queue(true)
        .await
        .unwrap();

    let session_id = Uuid::new_v4();

    // Send a message
    let message = MessageBuilder::new(session_id)
        .priority(Priority::Normal)
        .message_type(MessageType::Log(LogMessage {
            level: "info".to_string(),
            content: "test message".to_string(),
            source: None,
        }))
        .build()
        .unwrap();

    manager.send_message(message.clone()).await.unwrap();

    // Receive the message
    let received = manager.receive_message(session_id).await.unwrap();
    assert!(received.is_some());
    assert_eq!(received.unwrap().id, message.id);
}

#[tokio::test]
async fn test_message_priority_ordering() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path())
        .await
        .unwrap()
        .with_message_queue(true)
        .await
        .unwrap();

    let session_id = Uuid::new_v4();

    // Send messages in random priority order
    let low = MessageBuilder::new(session_id)
        .priority(Priority::Low)
        .message_type(MessageType::Log(LogMessage {
            level: "debug".to_string(),
            content: "low priority".to_string(),
            source: None,
        }))
        .build()
        .unwrap();

    let urgent = MessageBuilder::new(session_id)
        .priority(Priority::Urgent)
        .message_type(MessageType::Log(LogMessage {
            level: "error".to_string(),
            content: "urgent message".to_string(),
            source: None,
        }))
        .build()
        .unwrap();

    let normal = MessageBuilder::new(session_id)
        .priority(Priority::Normal)
        .message_type(MessageType::Log(LogMessage {
            level: "info".to_string(),
            content: "normal message".to_string(),
            source: None,
        }))
        .build()
        .unwrap();

    manager.send_message(low.clone()).await.unwrap();
    manager.send_message(urgent.clone()).await.unwrap();
    manager.send_message(normal.clone()).await.unwrap();

    // Should receive in priority order: Urgent -> Normal -> Low
    let msg1 = manager.receive_message(session_id).await.unwrap().unwrap();
    assert_eq!(msg1.id, urgent.id);

    let msg2 = manager.receive_message(session_id).await.unwrap().unwrap();
    assert_eq!(msg2.id, normal.id);

    let msg3 = manager.receive_message(session_id).await.unwrap().unwrap();
    assert_eq!(msg3.id, low.id);

    // Queue should be empty now
    assert!(manager.receive_message(session_id).await.unwrap().is_none());
}

#[tokio::test]
async fn test_peek_message() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path())
        .await
        .unwrap()
        .with_message_queue(true)
        .await
        .unwrap();

    let session_id = Uuid::new_v4();

    let message = MessageBuilder::new(session_id)
        .priority(Priority::High)
        .message_type(MessageType::Log(LogMessage {
            level: "warn".to_string(),
            content: "test".to_string(),
            source: None,
        }))
        .build()
        .unwrap();

    manager.send_message(message.clone()).await.unwrap();

    // Peek should not remove the message
    let peeked = manager.peek_message(session_id).await;
    assert!(peeked.is_some());
    assert_eq!(peeked.unwrap().id, message.id);

    // Queue size should still be 1
    assert_eq!(manager.queue_size(session_id).await, 1);

    // Receive should remove it
    let received = manager.receive_message(session_id).await.unwrap();
    assert!(received.is_some());
    assert_eq!(received.unwrap().id, message.id);

    // Now queue should be empty
    assert_eq!(manager.queue_size(session_id).await, 0);
}

#[tokio::test]
async fn test_filter_by_type() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path())
        .await
        .unwrap()
        .with_message_queue(true)
        .await
        .unwrap();

    let session_id = Uuid::new_v4();

    // Send different message types
    let log_msg = MessageBuilder::new(session_id)
        .priority(Priority::Normal)
        .message_type(MessageType::Log(LogMessage {
            level: "info".to_string(),
            content: "log".to_string(),
            source: None,
        }))
        .build()
        .unwrap();

    let cmd_msg = MessageBuilder::new(session_id)
        .priority(Priority::Normal)
        .command("test_cmd".to_string(), vec![])
        .build()
        .unwrap();

    manager.send_message(log_msg).await.unwrap();
    manager.send_message(cmd_msg).await.unwrap();

    // Filter by type
    let log_messages = manager.filter_messages_by_type(session_id, "log").await;
    assert_eq!(log_messages.len(), 1);

    let cmd_messages = manager.filter_messages_by_type(session_id, "command").await;
    assert_eq!(cmd_messages.len(), 1);
}

#[tokio::test]
async fn test_filter_by_priority() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path())
        .await
        .unwrap()
        .with_message_queue(true)
        .await
        .unwrap();

    let session_id = Uuid::new_v4();

    // Send messages with different priorities
    for priority in [Priority::Low, Priority::Normal, Priority::High, Priority::Urgent] {
        let msg = MessageBuilder::new(session_id)
            .priority(priority)
            .message_type(MessageType::Log(LogMessage {
                level: "info".to_string(),
                content: format!("{:?}", priority),
                source: None,
            }))
            .build()
            .unwrap();

        manager.send_message(msg).await.unwrap();
    }

    // Filter high priority and above
    let high_priority = manager.filter_messages_by_priority(session_id, Priority::High).await;
    assert_eq!(high_priority.len(), 2); // High + Urgent

    // Filter normal priority and above
    let normal_and_above = manager.filter_messages_by_priority(session_id, Priority::Normal).await;
    assert_eq!(normal_and_above.len(), 3); // Normal + High + Urgent
}

#[tokio::test]
async fn test_queue_stats() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path())
        .await
        .unwrap()
        .with_message_queue(true)
        .await
        .unwrap();

    let session_id = Uuid::new_v4();

    // Send 2 urgent, 3 normal messages
    for _ in 0..2 {
        let msg = MessageBuilder::new(session_id)
            .priority(Priority::Urgent)
            .message_type(MessageType::Log(LogMessage {
                level: "error".to_string(),
                content: "urgent".to_string(),
                source: None,
            }))
            .build()
            .unwrap();

        manager.send_message(msg).await.unwrap();
    }

    for _ in 0..3 {
        let msg = MessageBuilder::new(session_id)
            .priority(Priority::Normal)
            .message_type(MessageType::Log(LogMessage {
                level: "info".to_string(),
                content: "normal".to_string(),
                source: None,
            }))
            .build()
            .unwrap();

        manager.send_message(msg).await.unwrap();
    }

    let stats = manager.get_queue_stats(session_id).await.unwrap();
    assert_eq!(stats.current_size, 5);
    assert_eq!(stats.total_enqueued, 5);
    assert_eq!(stats.total_dequeued, 0);
    assert_eq!(stats.urgent_priority, 2);
    assert_eq!(stats.normal_priority, 3);

    // Dequeue one message
    manager.receive_message(session_id).await.unwrap();

    let stats2 = manager.get_queue_stats(session_id).await.unwrap();
    assert_eq!(stats2.current_size, 4);
    assert_eq!(stats2.total_dequeued, 1);
}

#[tokio::test]
async fn test_global_queue_stats() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path())
        .await
        .unwrap()
        .with_message_queue(true)
        .await
        .unwrap();

    let session1 = Uuid::new_v4();
    let session2 = Uuid::new_v4();

    // Send messages to session1
    for _ in 0..3 {
        let msg = MessageBuilder::new(session1)
            .priority(Priority::Normal)
            .message_type(MessageType::Log(LogMessage {
                level: "info".to_string(),
                content: "s1".to_string(),
                source: None,
            }))
            .build()
            .unwrap();

        manager.send_message(msg).await.unwrap();
    }

    // Send messages to session2
    for _ in 0..2 {
        let msg = MessageBuilder::new(session2)
            .priority(Priority::High)
            .message_type(MessageType::Log(LogMessage {
                level: "warn".to_string(),
                content: "s2".to_string(),
                source: None,
            }))
            .build()
            .unwrap();

        manager.send_message(msg).await.unwrap();
    }

    let global_stats = manager.get_global_queue_stats().await.unwrap();
    assert_eq!(global_stats.total_sessions, 2);
    assert_eq!(global_stats.total_messages, 5);
    assert_eq!(global_stats.normal_priority, 3);
    assert_eq!(global_stats.high_priority, 2);
}

#[tokio::test]
async fn test_message_expiration() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path())
        .await
        .unwrap()
        .with_message_queue(true)
        .await
        .unwrap();

    let session_id = Uuid::new_v4();

    // Send an expired message
    let expired = Message::with_expiration(
        session_id,
        Priority::Normal,
        MessageType::Log(LogMessage { level: "info".to_string(), content: "expired".to_string(), source: None }),
        -1, // expired 1 second ago
    );

    manager.send_message(expired).await.unwrap();
    assert_eq!(manager.queue_size(session_id).await, 1);

    // Cleanup expired messages
    let removed = manager.cleanup_expired_messages().await.unwrap();
    assert_eq!(removed, 1);
    assert_eq!(manager.queue_size(session_id).await, 0);
}

#[tokio::test]
async fn test_integration_with_session_lifecycle() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path())
        .await
        .unwrap()
        .with_message_queue(true)
        .await
        .unwrap();

    // Create a session context (not spawning actual agent for test)
    let session_id = Uuid::new_v4();

    // Send commands to the session
    let cmd1 = MessageBuilder::new(session_id)
        .priority(Priority::High)
        .command("run_tests".to_string(), vec!["--all".to_string()])
        .build()
        .unwrap();

    let cmd2 = MessageBuilder::new(session_id)
        .priority(Priority::Normal)
        .command("build".to_string(), vec![])
        .build()
        .unwrap();

    manager.send_message(cmd1).await.unwrap();
    manager.send_message(cmd2).await.unwrap();

    // List all messages
    let messages = manager.list_messages(session_id).await;
    assert_eq!(messages.len(), 2);

    // Process messages in priority order
    let msg1 = manager.receive_message(session_id).await.unwrap().unwrap();
    match msg1.message_type {
        MessageType::Command(cmd) => {
            assert_eq!(cmd.command, "run_tests");
        }
        _ => panic!("Expected command message"),
    }

    let msg2 = manager.receive_message(session_id).await.unwrap().unwrap();
    match msg2.message_type {
        MessageType::Command(cmd) => {
            assert_eq!(cmd.command, "build");
        }
        _ => panic!("Expected command message"),
    }

    // Queue should be empty
    assert!(manager.receive_message(session_id).await.unwrap().is_none());
}
