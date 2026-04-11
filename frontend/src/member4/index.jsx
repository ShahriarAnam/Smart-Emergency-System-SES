/**
 * Member 4 Components: History, Dashboard & Notifications
 * 
 * This module consolidates user dashboard, emergency history, and notification features.
 * 
 * Exports:
 * - Dashboard: Main dashboard showing all user emergencies (requester/helper views)
 * - History: Emergency request history with full timeline and messages
 * - StatusTimeline: Visual timeline of emergency request status changes
 */

// Re-export main dashboard
export { default as Dashboard } from '../pages/Dashboard';

// Re-export history view
export { default as History } from '../pages/NotificationHistory';

// Re-export status timeline component
export { default as StatusTimeline } from '../components/StatusTimeline';
