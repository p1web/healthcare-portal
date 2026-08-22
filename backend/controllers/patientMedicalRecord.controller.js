// controllers/patientMedicalRecord.controller.js
const { PatientProfile, PatientAllergy, PatientMedicalCondition } = require('../models');

async function getOrCreateProfile(userId) {
  let profile = await PatientProfile.findOne({ where: { userId } });
  if (!profile) {
    profile = await PatientProfile.create({ userId });
  }
  return profile;
}

const today = () => new Date().toISOString().slice(0, 10);

// ---------------- ALLERGIES ----------------

exports.listAllergies = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ where: { userId: req.user.id } });

    const allergies = profile
      ? await PatientAllergy.findAll({
          where: { patientProfileId: profile.id },
          order: [['status', 'ASC'], ['createdAt', 'DESC']]
        })
      : [];

    return res.json({ success: true, data: allergies });
  } catch (error) {
    console.error('List allergies error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch allergies' });
  }
};

exports.addAllergy = async (req, res) => {
  try {
    const { name, severity, reaction, diagnosedDate, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Allergy name is required' });
    }

    const profile = await getOrCreateProfile(req.user.id);

    const allergy = await PatientAllergy.create({
      patientProfileId: profile.id,
      name: name.trim(),
      severity: severity || null,
      reaction: reaction || null,
      diagnosedDate: diagnosedDate || null,
      notes: notes || null
    });

    return res.status(201).json({ success: true, message: 'Allergy added', data: allergy });
  } catch (error) {
    console.error('Add allergy error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add allergy' });
  }
};

exports.updateAllergy = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const allergy = await PatientAllergy.findOne({
      where: { id: req.params.id, patientProfileId: profile.id }
    });

    if (!allergy) {
      return res.status(404).json({ success: false, message: 'Allergy not found' });
    }

    const { name, severity, reaction, status, diagnosedDate, resolvedDate, notes } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (severity !== undefined) updates.severity = severity || null;
    if (reaction !== undefined) updates.reaction = reaction || null;
    if (diagnosedDate !== undefined) updates.diagnosedDate = diagnosedDate || null;
    if (notes !== undefined) updates.notes = notes || null;

    if (status !== undefined) {
      updates.status = status;
      updates.resolvedDate = status === 'resolved' ? (resolvedDate || today()) : null;
    }

    await allergy.update(updates);

    return res.json({ success: true, message: 'Allergy updated', data: allergy });
  } catch (error) {
    console.error('Update allergy error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update allergy' });
  }
};

exports.deleteAllergy = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const deleted = await PatientAllergy.destroy({
      where: { id: req.params.id, patientProfileId: profile.id }
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Allergy not found' });
    }

    return res.json({ success: true, message: 'Allergy removed' });
  } catch (error) {
    console.error('Delete allergy error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete allergy' });
  }
};

// ---------------- MEDICAL CONDITIONS ----------------

exports.listMedicalConditions = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ where: { userId: req.user.id } });

    const conditions = profile
      ? await PatientMedicalCondition.findAll({
          where: { patientProfileId: profile.id },
          order: [['status', 'ASC'], ['createdAt', 'DESC']]
        })
      : [];

    return res.json({ success: true, data: conditions });
  } catch (error) {
    console.error('List medical conditions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch medical conditions' });
  }
};

exports.addMedicalCondition = async (req, res) => {
  try {
    const { name, status, diagnosedDate, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Condition name is required' });
    }

    const profile = await getOrCreateProfile(req.user.id);

    const condition = await PatientMedicalCondition.create({
      patientProfileId: profile.id,
      name: name.trim(),
      status: status || 'active',
      diagnosedDate: diagnosedDate || null,
      notes: notes || null
    });

    return res.status(201).json({ success: true, message: 'Medical condition added', data: condition });
  } catch (error) {
    console.error('Add medical condition error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add medical condition' });
  }
};

exports.updateMedicalCondition = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const condition = await PatientMedicalCondition.findOne({
      where: { id: req.params.id, patientProfileId: profile.id }
    });

    if (!condition) {
      return res.status(404).json({ success: false, message: 'Medical condition not found' });
    }

    const { name, status, diagnosedDate, resolvedDate, notes } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (diagnosedDate !== undefined) updates.diagnosedDate = diagnosedDate || null;
    if (notes !== undefined) updates.notes = notes || null;

    if (status !== undefined) {
      updates.status = status;
      updates.resolvedDate = status === 'resolved' ? (resolvedDate || today()) : null;
    }

    await condition.update(updates);

    return res.json({ success: true, message: 'Medical condition updated', data: condition });
  } catch (error) {
    console.error('Update medical condition error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update medical condition' });
  }
};

exports.deleteMedicalCondition = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const deleted = await PatientMedicalCondition.destroy({
      where: { id: req.params.id, patientProfileId: profile.id }
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Medical condition not found' });
    }

    return res.json({ success: true, message: 'Medical condition removed' });
  } catch (error) {
    console.error('Delete medical condition error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete medical condition' });
  }
};
