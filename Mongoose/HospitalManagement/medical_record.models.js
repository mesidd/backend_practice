import mongoose from 'mongoose'

const medicalHistory = new mongoose.Schema({
  pastIllness : [
    {
      type: String
    }
  ],
  surgeries:{
    type: String,
  },
  hospitalizations:{
    type: Boolean,
    required: true,
    default: false
  }
})

const medicalRecordSchema = new mongoose.Schema({
  allergies:[
    {
      type: String
    }
  ],
  symptom: [
    {
      type: String
    }
  ],
  medicalhistory : [medicalHistory]

},{timestamps: true})

export const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema)
