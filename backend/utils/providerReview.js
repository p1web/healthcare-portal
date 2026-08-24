const PROFILE_REVIEW_STATUSES = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  CHANGES_REQUESTED: 'changes_requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
});

const ADMIN_REVIEW_STATUSES = new Set([
  PROFILE_REVIEW_STATUSES.UNDER_REVIEW,
  PROFILE_REVIEW_STATUSES.CHANGES_REQUESTED,
  PROFILE_REVIEW_STATUSES.APPROVED,
  PROFILE_REVIEW_STATUSES.REJECTED
]);

// Statuses a provider is allowed to submit for review from
const SUBMITTABLE_REVIEW_STATUSES = new Set([
  PROFILE_REVIEW_STATUSES.DRAFT,
  PROFILE_REVIEW_STATUSES.CHANGES_REQUESTED
]);

function normalizeProfileReviewStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function isApprovedStatus(status) {
  return normalizeProfileReviewStatus(status) === PROFILE_REVIEW_STATUSES.APPROVED;
}

function canSubmitForReview(status) {
  return SUBMITTABLE_REVIEW_STATUSES.has(normalizeProfileReviewStatus(status));
}

function canEditProfile(status) {
  return SUBMITTABLE_REVIEW_STATUSES.has(normalizeProfileReviewStatus(status));
}

// Returns the list of required fields that are missing/empty on a profile instance
function getMissingRequiredFields(profile, requiredFields) {
  return requiredFields.filter((field) => {
    const value = profile[field];
    return value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0);
  });
}

function buildDraftReviewReset() {
  return {
    verificationStatus: PROFILE_REVIEW_STATUSES.DRAFT,
    submittedAt: null,
    reviewedByUserId: null,
    reviewedAt: null,
    reviewNotes: null,
    rejectionReason: null
  };
}

function buildSubmittedReviewReset() {
  return {
    verificationStatus: PROFILE_REVIEW_STATUSES.SUBMITTED,
    submittedAt: new Date(),
    reviewedByUserId: null,
    reviewedAt: null,
    reviewNotes: null,
    rejectionReason: null
  };
}

function buildAdminReviewUpdate({ currentStatus, status, reviewerId, reviewNotes, rejectionReason }) {
  const normalizedCurrentStatus = normalizeProfileReviewStatus(currentStatus);
  const normalizedStatus = normalizeProfileReviewStatus(status);

  if (!ADMIN_REVIEW_STATUSES.has(normalizedStatus)) {
    throw new Error(`Invalid review status '${status}'`);
  }

  const isStartingReview = normalizedStatus === PROFILE_REVIEW_STATUSES.UNDER_REVIEW;
  const validTransition = isStartingReview
    ? normalizedCurrentStatus === PROFILE_REVIEW_STATUSES.SUBMITTED
    : normalizedCurrentStatus === PROFILE_REVIEW_STATUSES.UNDER_REVIEW;

  if (!validTransition) {
    throw new Error(`Cannot move profile from '${currentStatus}' to '${status}'`);
  }

  const comments = String(reviewNotes || rejectionReason || '').trim();
  if (!isStartingReview && !comments) {
    throw new Error('Comments are required to approve, reject, or return a profile');
  }

  const updates = {
    verificationStatus: normalizedStatus,
    reviewedByUserId: reviewerId,
    reviewedAt: new Date(),
    reviewNotes: comments || null,
    rejectionReason:
      normalizedStatus === PROFILE_REVIEW_STATUSES.CHANGES_REQUESTED || normalizedStatus === PROFILE_REVIEW_STATUSES.REJECTED
        ? comments
        : null,
    ...(normalizedStatus === PROFILE_REVIEW_STATUSES.APPROVED ? { lastVerifiedAt: new Date() } : {})
  };

  if (normalizedStatus === PROFILE_REVIEW_STATUSES.UNDER_REVIEW) {
    updates.reviewNotes = null;
  }

  return updates;
}

module.exports = {
  PROFILE_REVIEW_STATUSES,
  ADMIN_REVIEW_STATUSES,
  SUBMITTABLE_REVIEW_STATUSES,
  normalizeProfileReviewStatus,
  isApprovedStatus,
  canSubmitForReview,
  canEditProfile,
  getMissingRequiredFields,
  buildDraftReviewReset,
  buildSubmittedReviewReset,
  buildAdminReviewUpdate
};