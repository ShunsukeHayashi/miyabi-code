//! Feedback Collection System - Discord → GitHub Issue automation
//!
//! ユーザーフィードバックをDiscordから収集し、GitHub Issueに自動変換します。

use twilight_model::channel::Message;
use twilight_model::id::{marker::MessageMarker, Id};

/// Feedback entry collected from Discord
#[derive(Debug, Clone)]
pub struct FeedbackEntry {
    /// Discord message ID
    pub message_id: Id<MessageMarker>,
    /// User who posted the feedback
    pub author_name: String,
    /// Author Discord ID
    pub author_id: String,
    /// Feedback content
    pub content: String,
    /// Discord message URL
    pub message_url: String,
    /// Reaction counts
    pub reactions: FeedbackReactions,
    /// Feedback type (inferred from reactions or keywords)
    pub feedback_type: FeedbackType,
}

/// Reaction counts for feedback prioritization
#[derive(Debug, Clone, Default)]
pub struct FeedbackReactions {
    /// 👍 upvotes - general agreement
    pub upvotes: u32,
    /// 🐛 bug reports
    pub bug_reports: u32,
    /// ✨ feature requests
    pub feature_requests: u32,
    /// 🔥 high priority
    pub high_priority: u32,
}

/// Type of feedback
#[derive(Debug, Clone, PartialEq)]
pub enum FeedbackType {
    /// Bug report
    Bug,
    /// Feature request
    Feature,
    /// General feedback
    General,
    /// Question
    Question,
}

impl FeedbackEntry {
    /// Create new feedback entry from Discord message
    pub fn from_message(msg: &Message) -> Self {
        let content = msg.content.clone();
        let feedback_type = Self::infer_type(&content);

        let message_url = format!(
            "https://discord.com/channels/{}/{}/{}",
            msg.guild_id.map(|id| id.to_string()).unwrap_or_default(),
            msg.channel_id,
            msg.id
        );

        Self {
            message_id: msg.id,
            author_name: msg.author.name.clone(),
            author_id: msg.author.id.to_string(),
            content,
            message_url,
            reactions: FeedbackReactions::default(),
            feedback_type,
        }
    }

    /// Infer feedback type from content keywords
    fn infer_type(content: &str) -> FeedbackType {
        let content_lower = content.to_lowercase();

        if content_lower.contains("バグ")
            || content_lower.contains("bug")
            || content_lower.contains("エラー")
            || content_lower.contains("error")
            || content_lower.contains("動かない")
            || content_lower.contains("doesn't work")
        {
            FeedbackType::Bug
        } else if content_lower.contains("機能")
            || content_lower.contains("feature")
            || content_lower.contains("欲しい")
            || content_lower.contains("want")
            || content_lower.contains("追加")
            || content_lower.contains("add")
            || content_lower.contains("できたら")
            || content_lower.contains("would be nice")
        {
            FeedbackType::Feature
        } else if content_lower.contains("質問")
            || content_lower.contains("question")
            || content_lower.contains("どうやって")
            || content_lower.contains("how to")
            || content_lower.contains("教えて")
            || content_lower.contains("help")
        {
            FeedbackType::Question
        } else {
            FeedbackType::General
        }
    }

    /// Calculate priority score based on reactions
    pub fn priority_score(&self) -> u32 {
        self.reactions.upvotes
            + self.reactions.bug_reports * 3
            + self.reactions.feature_requests * 2
            + self.reactions.high_priority * 5
    }

    /// Check if feedback should be converted to GitHub Issue
    /// 閾値: 5ポイント以上
    pub fn should_create_issue(&self) -> bool {
        self.priority_score() >= 5
    }

    /// Convert to GitHub Issue title
    pub fn to_issue_title(&self) -> String {
        let prefix = match self.feedback_type {
            FeedbackType::Bug => "[Bug]",
            FeedbackType::Feature => "[Feature Request]",
            FeedbackType::Question => "[Question]",
            FeedbackType::General => "[Feedback]",
        };

        let content_preview = if self.content.len() > 60 {
            format!("{}...", &self.content[..60])
        } else {
            self.content.clone()
        };

        format!("{} {}", prefix, content_preview)
    }

    /// Convert to GitHub Issue body
    pub fn to_issue_body(&self) -> String {
        format!(
            "## 📋 Discord Community Feedback\n\n\
             **Posted by**: {}  \n\
             **Discord Message**: {}  \n\
             **Type**: {:?}  \n\n\
             ---\n\n\
             ### User Feedback\n\n\
             {}\n\n\
             ---\n\n\
             ### Reaction Stats\n\n\
             - 👍 Upvotes: {}  \n\
             - 🐛 Bug Reports: {}  \n\
             - ✨ Feature Requests: {}  \n\
             - 🔥 High Priority: {}  \n\
             - **Priority Score**: {}  \n\n\
             🤖 Generated with [Claude Code](https://claude.com/claude-code)  \n\
             Auto-generated from Discord Community feedback.",
            self.author_name,
            self.message_url,
            self.feedback_type,
            self.content,
            self.reactions.upvotes,
            self.reactions.bug_reports,
            self.reactions.feature_requests,
            self.reactions.high_priority,
            self.priority_score()
        )
    }

    /// Suggest labels based on feedback type
    pub fn suggest_labels(&self) -> Vec<String> {
        let mut labels = vec![];

        match self.feedback_type {
            FeedbackType::Bug => {
                labels.push("🐛 type:bug".to_string());
                if self.reactions.high_priority > 0 {
                    labels.push("🔥 priority:P0-Critical".to_string());
                } else {
                    labels.push("📝 priority:P2-Medium".to_string());
                }
            }
            FeedbackType::Feature => {
                labels.push("✨ type:feature".to_string());
                labels.push("📝 priority:P3-Low".to_string());
            }
            FeedbackType::Question => {
                labels.push("❓ type:question".to_string());
            }
            FeedbackType::General => {
                labels.push("💬 type:discussion".to_string());
            }
        }

        labels.push("👥 community".to_string());
        labels.push("📥 state:pending".to_string());

        labels
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_infer_bug_type() {
        let content = "バグを見つけました。ログインできません。";
        let feedback_type = FeedbackEntry::infer_type(content);
        assert_eq!(feedback_type, FeedbackType::Bug);
    }

    #[test]
    fn test_infer_feature_type() {
        let content = "新機能として、ダークモードが欲しいです。";
        let feedback_type = FeedbackEntry::infer_type(content);
        assert_eq!(feedback_type, FeedbackType::Feature);
    }

    #[test]
    fn test_priority_score() {
        let mut entry = FeedbackEntry {
            message_id: Id::new(1),
            author_name: "test_user".to_string(),
            author_id: "123".to_string(),
            content: "test feedback".to_string(),
            message_url: "https://discord.com/...".to_string(),
            reactions: FeedbackReactions {
                upvotes: 3,
                bug_reports: 2,
                feature_requests: 0,
                high_priority: 0,
            },
            feedback_type: FeedbackType::Bug,
        };

        // 3*1 + 2*3 = 9
        assert_eq!(entry.priority_score(), 9);
        assert!(entry.should_create_issue());
    }
}
