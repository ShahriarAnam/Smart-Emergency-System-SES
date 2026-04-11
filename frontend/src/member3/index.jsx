/**
 * Member 3 Components: Emergency Request Management & Chat
 * 
 * This module consolidates request management actions and real-time chat functionality.
 * 
 * Exports:
 * - ChatBox: Real-time chat interface for emergency communication
 * - RequestActions: Action buttons for accept/reject/complete/cancel operations
 * - RequestDetails: Emergency request details page with full action suite
 */

// Re-export chat component
export { default as ChatBox } from '../components/ChatBox';

// Re-export request details page (includes all request actions)
export { default as RequestDetails } from '../pages/RequestDetails';

// RequestActions can be created as a separate modular component if needed
// Currently, actions are integrated within RequestDetails page
