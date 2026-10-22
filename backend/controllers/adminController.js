const Organisation = require('../models/Organisation');
const Listing = require('../models/Listing');

const handleError = (res, err) => {
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid organisation ID format.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

// what an admin needs to check an organisation (never the password)
const ADMIN_FIELDS = 'name type category email contactName phone address locality lat lng fssaiLicence ' +
  'foodTypesAccepted capacityPerDay serviceRadiusKm reliabilityScore verified rejected rejectionReason reviewedAt createdAt';

// ── GET /api/admin/organisations ───────────────────────────────────────────────
// Admin only. Every donor and recipient, with how many listings / pickups each has.
const getOrganisations = async (req, res) => {
  try {
    const orgs = await Organisation.find({ type: { $ne: 'ADMIN' } })
      .select(ADMIN_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    // listings posted by each donor, and pickups completed by each shelter (aggregation)
    const posted = await Listing.aggregate([
      { $group: { _id: '$donor', count: { $sum: 1 } } },
    ]);
    const collected = await Listing.aggregate([
      { $match: { status: 'COLLECTED' } },
      { $group: { _id: '$acceptedBy', count: { $sum: 1 } } },
    ]);
    const countFor = (list, id) => {
      const row = list.find((r) => r._id && r._id.toString() === id.toString());
      return row ? row.count : 0;
    };
    orgs.forEach((o) => {
      o.listingsPosted = countFor(posted, o._id);
      o.pickupsCompleted = countFor(collected, o._id);
    });

    res.status(200).json(orgs);
  } catch (err) {
    handleError(res, err);
  }
};

// loads a recipient for verify / reject, or sends 404
const loadRecipient = async (req, res) => {
  const org = await Organisation.findById(req.params.id);
  if (!org || org.type !== 'RECIPIENT') {
    res.status(404).json({ message: 'Shelter not found.' });
    return null;
  }
  return org;
};

// ── POST /api/admin/organisations/:id/verify ───────────────────────────────────
// Admin only. The shelter starts receiving offers.
const verifyOrganisation = async (req, res) => {
  try {
    const org = await loadRecipient(req, res);
    if (!org) return;
    org.verified = true;
    org.rejected = false;
    org.rejectionReason = '';
    org.reviewedAt = new Date();
    await org.save();
    res.status(200).json({ message: org.name + ' is verified and will now receive offers.' });
  } catch (err) {
    handleError(res, err);
  }
};

// ── POST /api/admin/organisations/:id/reject ───────────────────────────────────
// Admin only. Body: { reason }. The shelter gets no offers and sees the reason.
const rejectOrganisation = async (req, res) => {
  try {
    const reason = String((req.body && req.body.reason) || '').trim();
    if (!reason) {
      return res.status(400).json({ message: 'Give a reason so the shelter knows what to fix.' });
    }
    const org = await loadRecipient(req, res);
    if (!org) return;
    org.verified = false;
    org.rejected = true;
    org.rejectionReason = reason.slice(0, 300);
    org.reviewedAt = new Date();
    await org.save();
    res.status(200).json({ message: org.name + ' was not approved.' });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { getOrganisations, verifyOrganisation, rejectOrganisation };
