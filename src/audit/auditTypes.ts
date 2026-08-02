export type AuditEventType = 
  | 'meeting_detected'
  | 'capture_started'
  | 'capture_stopped'
  | 'transcript_segment_captured'
  | 'consensus_generation_started'
  | 'consensus_generated'
  | 'consensus_generation_error'
  | 'markdown_exported'
  | 'meeting_ended'
  | 'sidepanel_opened'
  | 'sidepanel_restored'
  | 'meeting_cleared'
  | 'consensus_edited_and_obtained'
  | 'install_clicked'
  | 'paywall_viewed'
  | 'waitlist_joined'
  | 'validation_link_opened'
  | 'agreed_clicked'
  | 'objection_clicked'
  | 'objection_submitted'
  | 'landing_viewed'
  | 'beta_clicked'
  | 'understanding_generated'
  | 'validation_link_created'
  | 'premium_feature_clicked'
  | 'pdf_clicked'
  | 'whatsapp_clicked'
  | 'handshake_signed'
  | 'counterparty_claimed';

export interface AuditEvent {
  id: string;
  meeting_id: string;
  type: AuditEventType;
  timestamp: number;
  details?: Record<string, any>;
}
