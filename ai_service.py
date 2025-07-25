import os
import json
import logging
from openai import OpenAI
from models import Patient, MedicalRecord, TreatmentOrder

# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "default_key")
openai = OpenAI(api_key=OPENAI_API_KEY)

class ClinicalAI:
    def __init__(self):
        self.client = openai
        
    def process_doctor_query(self, query, patient_id=None, context=None):
        """Process doctor's query with AI assistance"""
        try:
            system_prompt = """You are an AI assistant for healthcare professionals. 
            You help doctors and nurses with patient information, treatment suggestions, 
            and clinical decision support. Always provide accurate, evidence-based responses.
            If asked about specific medical procedures or medications, provide general guidance 
            but remind users to follow institutional protocols and consult current medical literature.
            
            Respond in JSON format with the following structure:
            {
                "response": "main response text",
                "action": "suggested action if any",
                "priority": "low|normal|high|urgent",
                "suggestions": ["list of suggestions if applicable"]
            }
            """
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
            
            # Add patient context if available
            if patient_id and context:
                context_prompt = f"Patient context: {context}"
                messages.append({"role": "user", "content": context_prompt})
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                response_format={"type": "json_object"},
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logging.error(f"AI processing error: {e}")
            return {
                "response": "I apologize, but I'm currently unable to process your request. Please try again later.",
                "action": None,
                "priority": "normal",
                "suggestions": []
            }
    
    def generate_patient_summary(self, patient_id):
        """Generate AI-powered patient summary"""
        try:
            # Get patient data
            patient = Patient.query.get(patient_id)
            if not patient:
                return "Patient not found"
            
            medical_records = MedicalRecord.query.filter_by(patient_id=patient_id).all()
            treatment_orders = TreatmentOrder.query.filter_by(patient_id=patient_id).all()
            
            # Prepare context
            context = f"""Patient: {patient.first_name} {patient.last_name}
            Age: {patient.date_of_birth}
            Status: {patient.status}
            
            Recent Medical Records:
            """
            
            for record in medical_records[-3:]:  # Last 3 records
                context += f"- {record.visit_date}: {record.diagnosis}\n"
            
            context += "\nActive Treatment Orders:\n"
            for order in treatment_orders:
                if order.status != 'completed':
                    context += f"- {order.order_type}: {order.description} (Priority: {order.priority})\n"
            
            prompt = f"""Based on the following patient information, provide a concise clinical summary 
            highlighting key points, current status, and any important considerations:
            
            {context}
            
            Provide response in JSON format:
            {{
                "summary": "clinical summary text",
                "key_points": ["list of key points"],
                "recommendations": ["list of recommendations"]
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=400
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            logging.error(f"Summary generation error: {e}")
            return {
                "summary": "Unable to generate summary at this time",
                "key_points": [],
                "recommendations": []
            }
    
    def analyze_symptoms(self, symptoms_text):
        """Analyze symptoms and provide clinical insights"""
        try:
            prompt = f"""Analyze the following symptoms and provide clinical insights:
            
            Symptoms: {symptoms_text}
            
            Provide response in JSON format:
            {{
                "analysis": "clinical analysis of symptoms",
                "differential_diagnosis": ["list of possible conditions"],
                "recommended_tests": ["list of recommended tests"],
                "urgency_level": "low|normal|high|urgent"
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=400
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            logging.error(f"Symptom analysis error: {e}")
            return {
                "analysis": "Unable to analyze symptoms at this time",
                "differential_diagnosis": [],
                "recommended_tests": [],
                "urgency_level": "normal"
            }

# Global instance
clinical_ai = ClinicalAI()
