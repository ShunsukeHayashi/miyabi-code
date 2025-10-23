//! Goal management for feedback loops

use crate::error::{LoopError, LoopResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a goal for feedback loop execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Goal {
    /// Unique goal identifier
    pub id: String,

    /// Goal description
    pub description: String,

    /// Target metrics/criteria
    pub criteria: HashMap<String, f64>,

    /// Current iteration count
    pub iteration: usize,

    /// Goal refinement history
    pub refinements: Vec<String>,

    /// Goal status
    pub status: GoalStatus,
}

/// Goal execution status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GoalStatus {
    /// Goal is pending execution
    Pending,

    /// Goal is actively being executed
    Active,

    /// Goal achieved (converged)
    Completed,

    /// Goal execution failed
    Failed,

    /// Goal was cancelled
    Cancelled,
}

/// Manages goals for feedback loop execution
#[derive(Debug)]
pub struct GoalManager {
    goals: HashMap<String, Goal>,
}

impl GoalManager {
    /// Create a new goal manager
    pub fn new() -> Self {
        Self {
            goals: HashMap::new(),
        }
    }

    /// Create and register a new goal
    pub fn create_goal(&mut self, id: impl Into<String>, description: impl Into<String>) -> Goal {
        let goal = Goal {
            id: id.into(),
            description: description.into(),
            criteria: HashMap::new(),
            iteration: 0,
            refinements: Vec::new(),
            status: GoalStatus::Pending,
        };

        self.goals.insert(goal.id.clone(), goal.clone());
        goal
    }

    /// Get a goal by ID
    pub fn get_goal(&self, id: &str) -> LoopResult<&Goal> {
        self.goals
            .get(id)
            .ok_or_else(|| LoopError::GoalNotFound(id.to_string()))
    }

    /// Get a mutable reference to a goal
    pub fn get_goal_mut(&mut self, id: &str) -> LoopResult<&mut Goal> {
        self.goals
            .get_mut(id)
            .ok_or_else(|| LoopError::GoalNotFound(id.to_string()))
    }

    /// Update goal status
    pub fn update_status(&mut self, id: &str, status: GoalStatus) -> LoopResult<()> {
        let goal = self.get_goal_mut(id)?;
        goal.status = status;
        tracing::info!("Goal {} status updated to {:?}", id, status);
        Ok(())
    }

    /// Increment goal iteration count
    pub fn increment_iteration(&mut self, id: &str) -> LoopResult<usize> {
        let goal = self.get_goal_mut(id)?;
        goal.iteration += 1;
        Ok(goal.iteration)
    }

    /// Refine goal based on feedback
    pub fn refine_goal(&mut self, id: &str, feedback: &str) -> LoopResult<()> {
        let goal = self.get_goal_mut(id)?;
        goal.refinements.push(feedback.to_string());
        tracing::info!("Goal {} refined: {}", id, feedback);
        Ok(())
    }

    /// Add or update goal criterion
    pub fn set_criterion(&mut self, id: &str, key: impl Into<String>, value: f64) -> LoopResult<()> {
        let goal = self.get_goal_mut(id)?;
        goal.criteria.insert(key.into(), value);
        Ok(())
    }

    /// Remove a goal
    pub fn remove_goal(&mut self, id: &str) -> LoopResult<Goal> {
        self.goals
            .remove(id)
            .ok_or_else(|| LoopError::GoalNotFound(id.to_string()))
    }

    /// Get all active goals
    pub fn active_goals(&self) -> Vec<&Goal> {
        self.goals
            .values()
            .filter(|g| g.status == GoalStatus::Active)
            .collect()
    }

    /// Get goal count by status
    pub fn count_by_status(&self, status: GoalStatus) -> usize {
        self.goals.values().filter(|g| g.status == status).count()
    }
}

impl Default for GoalManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_goal() {
        let mut manager = GoalManager::new();
        let goal = manager.create_goal("test-1", "Test goal");

        assert_eq!(goal.id, "test-1");
        assert_eq!(goal.description, "Test goal");
        assert_eq!(goal.status, GoalStatus::Pending);
        assert_eq!(goal.iteration, 0);
    }

    #[test]
    fn test_get_goal() {
        let mut manager = GoalManager::new();
        manager.create_goal("test-1", "Test goal");

        let goal = manager.get_goal("test-1").unwrap();
        assert_eq!(goal.id, "test-1");

        let result = manager.get_goal("nonexistent");
        assert!(result.is_err());
    }

    #[test]
    fn test_update_status() {
        let mut manager = GoalManager::new();
        manager.create_goal("test-1", "Test goal");

        manager.update_status("test-1", GoalStatus::Active).unwrap();
        let goal = manager.get_goal("test-1").unwrap();
        assert_eq!(goal.status, GoalStatus::Active);
    }

    #[test]
    fn test_increment_iteration() {
        let mut manager = GoalManager::new();
        manager.create_goal("test-1", "Test goal");

        let iter1 = manager.increment_iteration("test-1").unwrap();
        assert_eq!(iter1, 1);

        let iter2 = manager.increment_iteration("test-1").unwrap();
        assert_eq!(iter2, 2);
    }

    #[test]
    fn test_refine_goal() {
        let mut manager = GoalManager::new();
        manager.create_goal("test-1", "Test goal");

        manager
            .refine_goal("test-1", "First refinement")
            .unwrap();
        manager
            .refine_goal("test-1", "Second refinement")
            .unwrap();

        let goal = manager.get_goal("test-1").unwrap();
        assert_eq!(goal.refinements.len(), 2);
        assert_eq!(goal.refinements[0], "First refinement");
    }

    #[test]
    fn test_set_criterion() {
        let mut manager = GoalManager::new();
        manager.create_goal("test-1", "Test goal");

        manager.set_criterion("test-1", "score", 85.0).unwrap();
        manager.set_criterion("test-1", "coverage", 90.0).unwrap();

        let goal = manager.get_goal("test-1").unwrap();
        assert_eq!(goal.criteria.len(), 2);
        assert_eq!(*goal.criteria.get("score").unwrap(), 85.0);
    }

    #[test]
    fn test_active_goals() {
        let mut manager = GoalManager::new();
        manager.create_goal("test-1", "Goal 1");
        manager.create_goal("test-2", "Goal 2");
        manager.create_goal("test-3", "Goal 3");

        manager.update_status("test-1", GoalStatus::Active).unwrap();
        manager.update_status("test-2", GoalStatus::Active).unwrap();

        let active = manager.active_goals();
        assert_eq!(active.len(), 2);
    }

    #[test]
    fn test_count_by_status() {
        let mut manager = GoalManager::new();
        manager.create_goal("test-1", "Goal 1");
        manager.create_goal("test-2", "Goal 2");
        manager.create_goal("test-3", "Goal 3");

        assert_eq!(manager.count_by_status(GoalStatus::Pending), 3);

        manager.update_status("test-1", GoalStatus::Active).unwrap();
        assert_eq!(manager.count_by_status(GoalStatus::Active), 1);
        assert_eq!(manager.count_by_status(GoalStatus::Pending), 2);
    }
}
