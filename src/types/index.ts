export type RiskLevel = 'high' | 'medium' | 'low';

export type CaseStatus = 'pending' | 'investigating' | 'verified' | 'closed';

export type AccountabilityStatus = 'none' | 'pending' | 'processing' | 'completed';

export interface Unit {
  id: string;
  name: string;
  category: string;
  level: string;
  contactPerson: string;
  contactPhone: string;
  address: string;
  totalCalls: number;
  riskScore: number;
  complianceRate: number;
  abnormalCount: number;
}

export interface Personnel {
  id: string;
  name: string;
  unitId: string;
  unitName: string;
  position: string;
  role: string;
  totalCalls: number;
  riskCount: number;
}

export interface Matter {
  id: string;
  name: string;
  code: string;
  category: string;
  department: string;
  requiredCerts: string[];
  totalCalls: number;
}

export interface CertRecord {
  id: string;
  certType: string;
  certNo: string;
  holderName: string;
  holderIdType: string;
  holderIdNo: string;
  issuer: string;
  issueDate: string;
  validFrom: string;
  validTo: string;
  status: 'valid' | 'expired' | 'revoked';
}

export interface ApprovalRecord {
  id: string;
  approverId: string;
  approverName: string;
  approvalTime: string;
  approvalOpinion: string;
  approvalResult: 'approved' | 'rejected' | 'pending';
}

export interface CallRecord {
  id: string;
  transactionId: string;
  callTime: string;
  unitId: string;
  unitName: string;
  personnelId: string;
  personnelName: string;
  matterId: string;
  matterName: string;
  certId: string;
  certType: string;
  certNo: string;
  holderName: string;
  operationType: 'query' | 'download' | 'verify' | 'share';
  sourceIp: string;
  deviceInfo: string;
  authorizationId?: string;
  authorizationTime?: string;
  authorizationExpireTime?: string;
  approvalId?: string;
  approvalRecord?: ApprovalRecord;
  hasApproval: boolean;
  hasResult: boolean;
  resultStatus?: 'completed' | 'processing' | 'rejected' | 'pending';
  isComplained: boolean;
  complainId?: string;
  complaintContent?: string;
  riskTags: string[];
  riskLevel: RiskLevel;
  remark?: string;
}

export interface RiskClue {
  id: string;
  clueNo: string;
  title: string;
  type: string;
  description: string;
  riskLevel: RiskLevel;
  unitId: string;
  unitName: string;
  personnelId?: string;
  personnelName?: string;
  relatedRecordIds: string[];
  discoveredTime: string;
  discoveredBy: string;
  status: CaseStatus;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  conclusion?: string;
  conclusionTime?: string;
  investigator?: string;
  accountabilityStatus: AccountabilityStatus;
  accountabilityResult?: string;
  tags: string[];
}

export interface EvidenceChain {
  id: string;
  transactionId: string;
  businessNo?: string;
  applicantName?: string;
  matterId: string;
  matterName: string;
  unitId: string;
  unitName: string;
  steps: EvidenceStep[];
  startTime: string;
  endTime: string;
  totalDuration: number;
  isComplete: boolean;
  riskPoints: string[];
}

export interface EvidenceStep {
  stepNo: number;
  stepName: string;
  operatorId?: string;
  operatorName?: string;
  unitId?: string;
  unitName?: string;
  actionTime: string;
  actionType: 'submit' | 'approve' | 'callCert' | 'download' | 'sign' | 'complete' | 'complain';
  certId?: string;
  certType?: string;
  authorizationCheck?: 'matched' | 'mismatched' | 'none';
  remark?: string;
  ip?: string;
}

export interface ComplaintRecord {
  id: string;
  complaintNo: string;
  complainantName: string;
  complainantPhone: string;
  complainantIdNo?: string;
  relatedTransactionId?: string;
  relatedUnitId?: string;
  relatedUnitName?: string;
  relatedPersonnelId?: string;
  relatedPersonnelName?: string;
  complaintType: string;
  complaintContent: string;
  complaintTime: string;
  status: 'pending' | 'processing' | 'replied' | 'closed';
  handler?: string;
  replyContent?: string;
  replyTime?: string;
  certInvolved?: string[];
}

export interface UnitComplianceMetrics {
  unitId: string;
  unitName: string;
  period: string;
  totalCalls: number;
  approvedCalls: number;
  approvalRate: number;
  unauthorizedCalls: number;
  expiredAuthCalls: number;
  resultRate: number;
  complaintCount: number;
  abnormalPatternCount: number;
  riskScore: number;
  complianceLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  dimensionScores: {
    approvalCompliance: number;
    authorizationAccuracy: number;
    resultEfficiency: number;
    complaintHandling: number;
    operationStandardization: number;
  };
}

export interface DailyStats {
  date: string;
  totalCalls: number;
  approvedCalls: number;
  abnormalCalls: number;
  complaintCount: number;
}
