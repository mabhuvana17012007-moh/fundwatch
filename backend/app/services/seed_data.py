import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.agency import Agency
from app.models.spending import SpendingRecord
from app.models.anomaly import Anomaly
from app.models.verification import VerificationCase
from app.models.evidence import Evidence
from app.models.data_import import DataImport
from app.models.settings import SystemSetting
from app.utils.hashing import calculate_sha256

# Centralized Dataset Definitions
INITIAL_AGENCIES = [
    {
        "id": 1,
        "original_name": "Maharashtra State Police Housing & Welfare Corp (MSPHC)",
        "normalized_name": "State Police Housing & Welfare Corporation",
        "state": "Maharashtra",
        "total_spending": 420.5,
        "avg_spending": 60.07,
        "median_spending": 45.2,
        "std_dev": 9.46,
        "spending_velocity": 4.2, # Highly accelerated
        "anomaly_count": 2,
        "risk_level": "Critical"
    },
    {
        "id": 2,
        "original_name": "PWD Civil Wing, Karnataka",
        "normalized_name": "Public Works Department (PWD)",
        "state": "Karnataka",
        "total_spending": 680.0,
        "avg_spending": 42.5,
        "median_spending": 38.0,
        "std_dev": 6.8,
        "spending_velocity": 1.25,
        "anomaly_count": 2,
        "risk_level": "High"
    },
    {
        "id": 3,
        "original_name": "District Rural Development Agency, Pune",
        "normalized_name": "District Rural Development Agency (DRDA)",
        "state": "Maharashtra",
        "total_spending": 310.0,
        "avg_spending": 31.0,
        "median_spending": 30.0,
        "std_dev": 4.1,
        "spending_velocity": 1.1,
        "anomaly_count": 1,
        "risk_level": "Medium"
    },
    {
        "id": 4,
        "original_name": "Karnataka Rural Infrastructure Development Ltd (KRIDL)",
        "normalized_name": "Karnataka Rural Infrastructure Dev Ltd (KRIDL)",
        "state": "Karnataka",
        "total_spending": 540.0,
        "avg_spending": 45.0,
        "median_spending": 44.0,
        "std_dev": 7.2,
        "spending_velocity": 2.1,
        "anomaly_count": 1,
        "risk_level": "High"
    },
    {
        "id": 5,
        "original_name": "Tamil Nadu Water Supply & Drainage Board (TWAD)",
        "normalized_name": "Tamil Nadu Water Supply & Drainage Board (TWAD)",
        "state": "Tamil Nadu",
        "total_spending": 490.0,
        "avg_spending": 37.69,
        "median_spending": 35.5,
        "std_dev": 5.3,
        "spending_velocity": 1.05,
        "anomaly_count": 0,
        "risk_level": "Low"
    },
    {
        "id": 6,
        "original_name": "National Buildings Construction Corporation (NBCC India)",
        "normalized_name": "National Buildings Construction Corp (NBCC)",
        "state": "Delhi / Central",
        "total_spending": 820.0,
        "avg_spending": 68.33,
        "median_spending": 65.0,
        "std_dev": 8.1,
        "spending_velocity": 1.15,
        "anomaly_count": 1,
        "risk_level": "Medium"
    },
    {
        "id": 7,
        "original_name": "Zilla Parishad Engineering Cell, Rajasthan",
        "normalized_name": "Zilla Parishad Engineering Division",
        "state": "Rajasthan",
        "total_spending": 275.0,
        "avg_spending": 27.5,
        "median_spending": 26.0,
        "std_dev": 3.8,
        "spending_velocity": 0.95,
        "anomaly_count": 0,
        "risk_level": "Low"
    }
]

# 18 Realistic MPLADS Projects
INITIAL_PROJECTS = [
    # THE HERO CRITICAL ANOMALY PROJECT
    {
        "id": 1,
        "work_id": "MPLADS-2024-MH-4011",
        "title": "Community Health Center Modernization & Trauma Care Unit",
        "state": "Maharashtra",
        "district": "Pune",
        "constituency": "Pune Parliamentary Constituency",
        "mp_name": "Hon. Murlidhar Mohol",
        "agency_id": 1,
        "category": "Healthcare",
        "description": "Establishment of high-dependency trauma care ward, diagnostic radiology equipment, and 24x7 emergency backup facility.",
        "sanctioned_amount": 95.0,
        "released_amount": 90.0,
        "expenditure": 79.0, # Jumped to 79L against 44L baseline
        "physical_progress": 48.0, # Lagging physical progress despite high spent
        "status": "Under Scrutiny",
        "completion_date": "2024-12-31",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "risk_level": "Critical",
        "anomaly_score": 92.0
    },
    # High Risk Project 2
    {
        "id": 2,
        "work_id": "MPLADS-2024-KA-1082",
        "title": "Solar-Powered Drinking Water Grid & RO Purification Hub",
        "state": "Karnataka",
        "district": "Bengaluru Rural",
        "constituency": "Bengaluru Rural",
        "mp_name": "Hon. Dr. C. N. Manjunath",
        "agency_id": 4,
        "category": "Water Supply",
        "description": "Installation of 15 solar-powered automated water dispensing units and reverse osmosis filtration plants across 4 taluks.",
        "sanctioned_amount": 75.0,
        "released_amount": 70.0,
        "expenditure": 64.5,
        "physical_progress": 55.0,
        "status": "Ongoing",
        "completion_date": "2025-02-28",
        "latitude": 13.0827,
        "longitude": 77.5877,
        "risk_level": "High",
        "anomaly_score": 76.5
    },
    # High Risk Project 3
    {
        "id": 3,
        "work_id": "MPLADS-2024-MH-2034",
        "title": "Smart Anganwadi & Early Childhood Nutrition Resource Hubs",
        "state": "Maharashtra",
        "district": "Nagpur",
        "constituency": "Nagpur",
        "mp_name": "Hon. Nitin Gadkari",
        "agency_id": 1,
        "category": "Education",
        "description": "Construction and digitization of 8 model preschool Anganwadi centers equipped with biometric attendance and modular kitchens.",
        "sanctioned_amount": 60.0,
        "released_amount": 55.0,
        "expenditure": 51.0,
        "physical_progress": 62.0,
        "status": "Ongoing",
        "completion_date": "2024-11-30",
        "latitude": 21.1458,
        "longitude": 79.0882,
        "risk_level": "High",
        "anomaly_score": 68.0
    },
    # Medium Risk Project 4
    {
        "id": 4,
        "work_id": "MPLADS-2024-KA-3045",
        "title": "Bridge & Approach Road Over Vrishabhavathi Channel",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "constituency": "Bengaluru South",
        "mp_name": "Hon. Tejasvi Surya",
        "agency_id": 2,
        "category": "Roads & Infrastructure",
        "description": "Construction of concrete box culvert bridge and 1.8km bitumen approach road for peri-urban agricultural transit.",
        "sanctioned_amount": 85.0,
        "released_amount": 80.0,
        "expenditure": 61.2,
        "physical_progress": 70.0,
        "status": "Ongoing",
        "completion_date": "2025-01-15",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "risk_level": "Medium",
        "anomaly_score": 54.0
    },
    # Medium Risk Project 5
    {
        "id": 5,
        "work_id": "MPLADS-2024-DL-5099",
        "title": "Vocational Skill Training Complex & Digital Computer Lab",
        "state": "Delhi / Central",
        "district": "New Delhi",
        "constituency": "New Delhi",
        "mp_name": "Hon. Bansuri Swaraj",
        "agency_id": 6,
        "category": "Education",
        "description": "Upgradation of municipal youth center with 60 terminal high-speed computer labs and renewable rooftop photovoltaic setup.",
        "sanctioned_amount": 120.0,
        "released_amount": 110.0,
        "expenditure": 94.0,
        "physical_progress": 75.0,
        "status": "Ongoing",
        "completion_date": "2024-10-31",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "risk_level": "Medium",
        "anomaly_score": 48.5
    },
    # Low Risk Project 6
    {
        "id": 6,
        "work_id": "MPLADS-2024-TN-6101",
        "title": "Desalination & Brackish Water Piping Network, Cuddalore",
        "state": "Tamil Nadu",
        "district": "Cuddalore",
        "constituency": "Cuddalore",
        "mp_name": "Hon. M. K. Vishnu Prasad",
        "agency_id": 5,
        "category": "Water Supply",
        "description": "Underground HDPE pipeline extension connecting coastal desalination facility to 12 inland village clusters.",
        "sanctioned_amount": 90.0,
        "released_amount": 85.0,
        "expenditure": 58.0,
        "physical_progress": 82.0,
        "status": "Ongoing",
        "completion_date": "2025-03-15",
        "latitude": 11.7480,
        "longitude": 79.7714,
        "risk_level": "Low",
        "anomaly_score": 18.0
    },
    # Low Risk Project 7
    {
        "id": 7,
        "work_id": "MPLADS-2024-RJ-7012",
        "title": "Rural Rainwater Harvesting & Community Check Dam Construction",
        "state": "Rajasthan",
        "district": "Jaipur Rural",
        "constituency": "Jaipur Rural",
        "mp_name": "Hon. Rao Rajendra Singh",
        "agency_id": 7,
        "category": "Water Supply",
        "description": "Masonry check dam and desiltation basin across dry seasonal catchment to replenish local groundwater aquifer tables.",
        "sanctioned_amount": 45.0,
        "released_amount": 45.0,
        "expenditure": 38.2,
        "physical_progress": 95.0,
        "status": "Completed",
        "completion_date": "2024-06-30",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "risk_level": "Low",
        "anomaly_score": 12.0
    },
    # Low Risk Project 8
    {
        "id": 8,
        "work_id": "MPLADS-2024-MH-8022",
        "title": "Solid Waste Decentralized Biomethanation Plant",
        "state": "Maharashtra",
        "district": "Thane",
        "constituency": "Kalyan",
        "mp_name": "Hon. Dr. Shrikant Shinde",
        "agency_id": 3,
        "category": "Sanitation",
        "description": "5 metric ton per day anaerobic digestion facility converting market organic waste into compressed biogas and bio-fertilizer.",
        "sanctioned_amount": 70.0,
        "released_amount": 65.0,
        "expenditure": 42.0,
        "physical_progress": 68.0,
        "status": "Ongoing",
        "completion_date": "2025-04-30",
        "latitude": 19.2403,
        "longitude": 73.1305,
        "risk_level": "Low",
        "anomaly_score": 22.0
    },
    # Low Risk Project 9
    {
        "id": 9,
        "work_id": "MPLADS-2024-TN-9031",
        "title": "Sub-Divisional Hospital Dialysis Wing & Power Backup",
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "constituency": "Coimbatore",
        "mp_name": "Hon. Ganapathi P. Rajkumar",
        "agency_id": 5,
        "category": "Healthcare",
        "description": "10-bed subsidized hemodialysis suite with automated water treatment system and continuous solar hybrid inverter system.",
        "sanctioned_amount": 80.0,
        "released_amount": 80.0,
        "expenditure": 72.0,
        "physical_progress": 90.0,
        "status": "Ongoing",
        "completion_date": "2024-09-30",
        "latitude": 11.0168,
        "longitude": 76.9558,
        "risk_level": "Low",
        "anomaly_score": 15.0
    },
    # Project 10
    {
        "id": 10,
        "work_id": "MPLADS-2024-KA-1144",
        "title": "Rural Community Library & Digital E-Learning Knowledge Kiosks",
        "state": "Karnataka",
        "district": "Mysuru",
        "constituency": "Mysuru",
        "mp_name": "Hon. Yaduveer Krishnadatta Chamaraja Wadiyar",
        "agency_id": 2,
        "category": "Public Amenities",
        "description": "Construction of two-story library complex with dedicated reading rooms and 20 multimedia terminals for competitive exam aspirants.",
        "sanctioned_amount": 55.0,
        "released_amount": 50.0,
        "expenditure": 36.5,
        "physical_progress": 72.0,
        "status": "Ongoing",
        "completion_date": "2025-01-31",
        "latitude": 12.2958,
        "longitude": 76.6394,
        "risk_level": "Low",
        "anomaly_score": 19.5
    },
    # Project 11
    {
        "id": 11,
        "work_id": "MPLADS-2024-MH-1255",
        "title": "Farmer Producer Cold Storage & Fruit Grading Center",
        "state": "Maharashtra",
        "district": "Nashik",
        "constituency": "Nashik",
        "mp_name": "Hon. Rajabhau Waje",
        "agency_id": 3,
        "category": "Public Amenities",
        "description": "100-MT capacity temperature-controlled holding room with automated sorting conveyor belts for smallholder onion and grape farmers.",
        "sanctioned_amount": 65.0,
        "released_amount": 60.0,
        "expenditure": 46.0,
        "physical_progress": 64.0,
        "status": "Ongoing",
        "completion_date": "2025-02-15",
        "latitude": 19.9975,
        "longitude": 73.7898,
        "risk_level": "Medium",
        "anomaly_score": 38.0
    },
    # Project 12
    {
        "id": 12,
        "work_id": "MPLADS-2024-RJ-1366",
        "title": "Government Higher Secondary Science Laboratory Wing",
        "state": "Rajasthan",
        "district": "Udaipur",
        "constituency": "Udaipur",
        "mp_name": "Hon. Manna Lal Rawat",
        "agency_id": 7,
        "category": "Education",
        "description": "Physics, Chemistry, and Biology laboratories equipped with modern optical microscopes, fume hoods, and fire safety systems.",
        "sanctioned_amount": 40.0,
        "released_amount": 40.0,
        "expenditure": 39.1,
        "physical_progress": 100.0,
        "status": "Completed",
        "completion_date": "2024-05-30",
        "latitude": 24.5854,
        "longitude": 73.7125,
        "risk_level": "Low",
        "anomaly_score": 9.0
    },
    # Project 13
    {
        "id": 13,
        "work_id": "MPLADS-2024-KA-1477",
        "title": "Sub-Urban Drainage & Stormwater Desiltation Canal",
        "state": "Karnataka",
        "district": "Mangaluru",
        "constituency": "Dakshina Kannada",
        "mp_name": "Hon. Brijesh Chowta",
        "agency_id": 2,
        "category": "Sanitation",
        "description": "RCC retaining wall construction along 2.4km stormwater stream to alleviate monsoon flooding in low-lying coastal colonies.",
        "sanctioned_amount": 78.0,
        "released_amount": 75.0,
        "expenditure": 62.0,
        "physical_progress": 80.0,
        "status": "Ongoing",
        "completion_date": "2024-11-15",
        "latitude": 12.9141,
        "longitude": 74.8560,
        "risk_level": "Medium",
        "anomaly_score": 42.0
    },
    # Project 14
    {
        "id": 14,
        "work_id": "MPLADS-2024-TN-1588",
        "title": "Community Solar Micro-Grid for Tribal Settlement",
        "state": "Tamil Nadu",
        "district": "The Nilgiris",
        "constituency": "Nilgiris",
        "mp_name": "Hon. A. Raja",
        "agency_id": 5,
        "category": "Public Amenities",
        "description": "40kW off-grid solar installation with battery storage micro-grid supplying uninterrupted clean energy to 85 indigenous households.",
        "sanctioned_amount": 50.0,
        "released_amount": 50.0,
        "expenditure": 47.5,
        "physical_progress": 96.0,
        "status": "Completed",
        "completion_date": "2024-07-15",
        "latitude": 11.4102,
        "longitude": 76.6950,
        "risk_level": "Low",
        "anomaly_score": 11.0
    },
    # Project 15
    {
        "id": 15,
        "work_id": "MPLADS-2024-DL-1699",
        "title": "Maternal & Child Health Care Mobile Outreach Vans (3 Units)",
        "state": "Delhi / Central",
        "district": "East Delhi",
        "constituency": "East Delhi",
        "mp_name": "Hon. Harsh Malhotra",
        "agency_id": 6,
        "category": "Healthcare",
        "description": "Fabrication and medical outfitting of three mobile health clinics with ultrasound equipment and immunization refrigeration.",
        "sanctioned_amount": 95.0,
        "released_amount": 95.0,
        "expenditure": 88.0,
        "physical_progress": 92.0,
        "status": "Ongoing",
        "completion_date": "2024-10-15",
        "latitude": 28.6280,
        "longitude": 77.2950,
        "risk_level": "Low",
        "anomaly_score": 24.0
    },
    # Project 16
    {
        "id": 16,
        "work_id": "MPLADS-2024-RJ-1710",
        "title": "Panchayat Veterinary Dispensary & Livestock Aid Center",
        "state": "Rajasthan",
        "district": "Jodhpur",
        "constituency": "Jodhpur",
        "mp_name": "Hon. Gajendra Singh Shekhawat",
        "agency_id": 7,
        "category": "Healthcare",
        "description": "Veterinary clinical center with surgical theater and cattle vaccination cold chain infrastructure for rural dairy producers.",
        "sanctioned_amount": 35.0,
        "released_amount": 35.0,
        "expenditure": 32.0,
        "physical_progress": 88.0,
        "status": "Ongoing",
        "completion_date": "2024-12-15",
        "latitude": 26.2389,
        "longitude": 73.0243,
        "risk_level": "Low",
        "anomaly_score": 14.0
    },
    # Project 17
    {
        "id": 17,
        "work_id": "MPLADS-2024-MH-1821",
        "title": "Solar Powered Agricultural Feeder Substation Link",
        "state": "Maharashtra",
        "district": "Kolhapur",
        "constituency": "Kolhapur",
        "mp_name": "Hon. Shahu Chhatrapati Maharaj",
        "agency_id": 3,
        "category": "Roads & Infrastructure",
        "description": "Dedicated 11kV distribution line interconnecting cooperative sugar cane lift irrigation pumps with agricultural substation.",
        "sanctioned_amount": 55.0,
        "released_amount": 50.0,
        "expenditure": 41.5,
        "physical_progress": 78.0,
        "status": "Ongoing",
        "completion_date": "2025-01-20",
        "latitude": 16.7050,
        "longitude": 74.2433,
        "risk_level": "Low",
        "anomaly_score": 21.0
    },
    # Project 18
    {
        "id": 18,
        "work_id": "MPLADS-2024-KA-1932",
        "title": "Gram Panchayat Solid Waste Composting & Segregation Yards",
        "state": "Karnataka",
        "district": "Belagavi",
        "constituency": "Belagavi",
        "mp_name": "Hon. Jagadish Shettar",
        "agency_id": 4,
        "category": "Sanitation",
        "description": "Constructed shed, rotary sieve machinery, and vermicomposting pits across 6 panchayat cluster hamlets.",
        "sanctioned_amount": 42.0,
        "released_amount": 40.0,
        "expenditure": 34.0,
        "physical_progress": 85.0,
        "status": "Ongoing",
        "completion_date": "2024-11-25",
        "latitude": 15.8497,
        "longitude": 74.4977,
        "risk_level": "Low",
        "anomaly_score": 17.5
    },
    # Additional state coverage projects
    {
        "id": 19,
        "work_id": "MPLADS-2024-GJ-2043",
        "title": "Primary Health Centre Solar Power Upgrade",
        "state": "Gujarat",
        "district": "Rajkot",
        "constituency": "Rajkot",
        "mp_name": "Hon. Parshottam Rupala",
        "agency_id": 2,
        "category": "Healthcare",
        "description": "Solar backup and essential equipment upgrade for a rural primary health centre serving nearby villages.",
        "sanctioned_amount": 58.0,
        "released_amount": 52.0,
        "expenditure": 41.0,
        "physical_progress": 76.0,
        "status": "Ongoing",
        "completion_date": "2025-02-28",
        "latitude": 22.3039,
        "longitude": 70.8022,
        "risk_level": "Low",
        "anomaly_score": 20.0
    },
    {
        "id": 20,
        "work_id": "MPLADS-2024-KL-2154",
        "title": "Coastal Community Flood Resilience Works",
        "state": "Kerala",
        "district": "Alappuzha",
        "constituency": "Alappuzha",
        "mp_name": "Hon. K. C. Venugopal",
        "agency_id": 5,
        "category": "Roads & Infrastructure",
        "description": "Raised access road and drainage improvements protecting coastal households during seasonal flooding.",
        "sanctioned_amount": 72.0,
        "released_amount": 68.0,
        "expenditure": 54.0,
        "physical_progress": 71.0,
        "status": "Ongoing",
        "completion_date": "2025-03-31",
        "latitude": 9.4981,
        "longitude": 76.3388,
        "risk_level": "Medium",
        "anomaly_score": 34.0
    },
    {
        "id": 21,
        "work_id": "MPLADS-2024-OD-2265",
        "title": "Rural Drinking Water Pipeline Extension",
        "state": "Odisha",
        "district": "Cuttack",
        "constituency": "Cuttack",
        "mp_name": "Hon. Bhartruhari Mahtab",
        "agency_id": 3,
        "category": "Water Supply",
        "description": "New pipeline network connecting six villages to a treated drinking water distribution point.",
        "sanctioned_amount": 64.0,
        "released_amount": 60.0,
        "expenditure": 43.5,
        "physical_progress": 69.0,
        "status": "Ongoing",
        "completion_date": "2025-01-31",
        "latitude": 20.4625,
        "longitude": 85.8828,
        "risk_level": "Low",
        "anomaly_score": 23.0
    },
    {
        "id": 22,
        "work_id": "MPLADS-2024-TS-2376",
        "title": "Government School Digital Learning Centre",
        "state": "Telangana",
        "district": "Warangal",
        "constituency": "Warangal",
        "mp_name": "Hon. Kadiyam Kavya",
        "agency_id": 2,
        "category": "Education",
        "description": "Classroom renovation with computer workstations, digital teaching equipment, and accessible sanitation facilities.",
        "sanctioned_amount": 48.0,
        "released_amount": 45.0,
        "expenditure": 39.0,
        "physical_progress": 84.0,
        "status": "Ongoing",
        "completion_date": "2024-12-31",
        "latitude": 17.9689,
        "longitude": 79.5941,
        "risk_level": "Low",
        "anomaly_score": 16.0
    },
    {
        "id": 23,
        "work_id": "MPLADS-2024-WB-2487",
        "title": "District Market Waste Processing Facility",
        "state": "West Bengal",
        "district": "Bardhaman",
        "constituency": "Bardhaman-Durgapur",
        "mp_name": "Hon. Kirti Azad",
        "agency_id": 3,
        "category": "Sanitation",
        "description": "Organic waste segregation and composting facility for a district market and surrounding municipalities.",
        "sanctioned_amount": 52.0,
        "released_amount": 49.0,
        "expenditure": 37.5,
        "physical_progress": 73.0,
        "status": "Ongoing",
        "completion_date": "2025-02-15",
        "latitude": 23.2324,
        "longitude": 87.8615,
        "risk_level": "Low",
        "anomaly_score": 19.0
    },
    {
        "id": 24,
        "work_id": "MPLADS-2024-UP-2598",
        "title": "Community Skill Development and Library Hub",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "constituency": "Lucknow",
        "mp_name": "Hon. Rajnath Singh",
        "agency_id": 6,
        "category": "Public Amenities",
        "description": "Renovation of a community facility with reading rooms, vocational classrooms, and accessible public services.",
        "sanctioned_amount": 88.0,
        "released_amount": 82.0,
        "expenditure": 66.0,
        "physical_progress": 67.0,
        "status": "Ongoing",
        "completion_date": "2025-04-30",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "risk_level": "Medium",
        "anomaly_score": 36.0
    },
    {
        "id": 25,
        "work_id": "MPLADS-2024-MP-2609",
        "title": "Block Hospital Emergency Care Expansion",
        "state": "Madhya Pradesh",
        "district": "Indore",
        "constituency": "Indore",
        "mp_name": "Hon. Shankar Lalwani",
        "agency_id": 1,
        "category": "Healthcare",
        "description": "Emergency ward expansion with oxygen infrastructure, patient beds, and improved ambulance access.",
        "sanctioned_amount": 92.0,
        "released_amount": 86.0,
        "expenditure": 70.0,
        "physical_progress": 61.0,
        "status": "Under Scrutiny",
        "completion_date": "2025-05-31",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "risk_level": "Medium",
        "anomaly_score": 44.0
    },
    {
        "id": 26,
        "work_id": "MPLADS-2024-AP-2710",
        "title": "Village Roads and Bus Shelter Improvements",
        "state": "Andhra Pradesh",
        "district": "Guntur",
        "constituency": "Guntur",
        "mp_name": "Hon. P. Chandrasekhar",
        "agency_id": 7,
        "category": "Roads & Infrastructure",
        "description": "Resurfacing of village approach roads and construction of weather-protected passenger shelters.",
        "sanctioned_amount": 61.0,
        "released_amount": 57.0,
        "expenditure": 45.0,
        "physical_progress": 79.0,
        "status": "Ongoing",
        "completion_date": "2025-01-15",
        "latitude": 16.3067,
        "longitude": 80.4365,
        "risk_level": "Low",
        "anomaly_score": 18.5
    }
]

# 8-Month Historical Spending Ledger for Charts & Baseline
# Months: January to August 2024
HISTORICAL_SPENDING = [
    # Project 1 (HERO Critical Anomaly: Jan=35, Feb=38, Mar=41, Apr=44 (Baseline=44), May=52, Jun=61, Jul=71, Aug=79)
    {"project_id": 1, "agency_id": 1, "month": "January", "year": 2024, "month_index": 1, "actual_expenditure": 35.0, "baseline_expenditure": 35.0, "cumulative_expenditure": 35.0, "velocity_multiplier": 1.0},
    {"project_id": 1, "agency_id": 1, "month": "February", "year": 2024, "month_index": 2, "actual_expenditure": 38.0, "baseline_expenditure": 38.0, "cumulative_expenditure": 73.0, "velocity_multiplier": 1.1},
    {"project_id": 1, "agency_id": 1, "month": "March", "year": 2024, "month_index": 3, "actual_expenditure": 41.0, "baseline_expenditure": 41.0, "cumulative_expenditure": 114.0, "velocity_multiplier": 1.15},
    {"project_id": 1, "agency_id": 1, "month": "April", "year": 2024, "month_index": 4, "actual_expenditure": 44.0, "baseline_expenditure": 44.0, "cumulative_expenditure": 158.0, "velocity_multiplier": 1.2},
    {"project_id": 1, "agency_id": 1, "month": "May", "year": 2024, "month_index": 5, "actual_expenditure": 52.0, "baseline_expenditure": 44.0, "cumulative_expenditure": 210.0, "velocity_multiplier": 1.8},
    {"project_id": 1, "agency_id": 1, "month": "June", "year": 2024, "month_index": 6, "actual_expenditure": 61.0, "baseline_expenditure": 44.0, "cumulative_expenditure": 271.0, "velocity_multiplier": 2.5},
    {"project_id": 1, "agency_id": 1, "month": "July", "year": 2024, "month_index": 7, "actual_expenditure": 71.0, "baseline_expenditure": 44.0, "cumulative_expenditure": 342.0, "velocity_multiplier": 3.4},
    {"project_id": 1, "agency_id": 1, "month": "August", "year": 2024, "month_index": 8, "actual_expenditure": 79.0, "baseline_expenditure": 44.0, "cumulative_expenditure": 421.0, "velocity_multiplier": 4.2},

    # Project 2 (High Risk)
    {"project_id": 2, "agency_id": 4, "month": "January", "year": 2024, "month_index": 1, "actual_expenditure": 18.0, "baseline_expenditure": 20.0, "cumulative_expenditure": 18.0, "velocity_multiplier": 0.9},
    {"project_id": 2, "agency_id": 4, "month": "February", "year": 2024, "month_index": 2, "actual_expenditure": 24.0, "baseline_expenditure": 22.0, "cumulative_expenditure": 42.0, "velocity_multiplier": 1.1},
    {"project_id": 2, "agency_id": 4, "month": "March", "year": 2024, "month_index": 3, "actual_expenditure": 28.0, "baseline_expenditure": 25.0, "cumulative_expenditure": 70.0, "velocity_multiplier": 1.2},
    {"project_id": 2, "agency_id": 4, "month": "April", "year": 2024, "month_index": 4, "actual_expenditure": 32.0, "baseline_expenditure": 28.0, "cumulative_expenditure": 102.0, "velocity_multiplier": 1.3},
    {"project_id": 2, "agency_id": 4, "month": "May", "year": 2024, "month_index": 5, "actual_expenditure": 40.0, "baseline_expenditure": 30.0, "cumulative_expenditure": 142.0, "velocity_multiplier": 1.6},
    {"project_id": 2, "agency_id": 4, "month": "June", "year": 2024, "month_index": 6, "actual_expenditure": 49.0, "baseline_expenditure": 32.0, "cumulative_expenditure": 191.0, "velocity_multiplier": 1.9},
    {"project_id": 2, "agency_id": 4, "month": "July", "year": 2024, "month_index": 7, "actual_expenditure": 57.0, "baseline_expenditure": 34.0, "cumulative_expenditure": 248.0, "velocity_multiplier": 2.2},
    {"project_id": 2, "agency_id": 4, "month": "August", "year": 2024, "month_index": 8, "actual_expenditure": 64.5, "baseline_expenditure": 35.0, "cumulative_expenditure": 312.5, "velocity_multiplier": 2.6},

    # Project 3 (High Risk)
    {"project_id": 3, "agency_id": 1, "month": "January", "year": 2024, "month_index": 1, "actual_expenditure": 12.0, "baseline_expenditure": 15.0, "cumulative_expenditure": 12.0, "velocity_multiplier": 0.8},
    {"project_id": 3, "agency_id": 1, "month": "February", "year": 2024, "month_index": 2, "actual_expenditure": 16.0, "baseline_expenditure": 16.0, "cumulative_expenditure": 28.0, "velocity_multiplier": 1.0},
    {"project_id": 3, "agency_id": 1, "month": "March", "year": 2024, "month_index": 3, "actual_expenditure": 22.0, "baseline_expenditure": 18.0, "cumulative_expenditure": 50.0, "velocity_multiplier": 1.2},
    {"project_id": 3, "agency_id": 1, "month": "April", "year": 2024, "month_index": 4, "actual_expenditure": 29.0, "baseline_expenditure": 20.0, "cumulative_expenditure": 79.0, "velocity_multiplier": 1.5},
    {"project_id": 3, "agency_id": 1, "month": "May", "year": 2024, "month_index": 5, "actual_expenditure": 35.0, "baseline_expenditure": 22.0, "cumulative_expenditure": 114.0, "velocity_multiplier": 1.8},
    {"project_id": 3, "agency_id": 1, "month": "June", "year": 2024, "month_index": 6, "actual_expenditure": 41.0, "baseline_expenditure": 24.0, "cumulative_expenditure": 155.0, "velocity_multiplier": 2.0},
    {"project_id": 3, "agency_id": 1, "month": "July", "year": 2024, "month_index": 7, "actual_expenditure": 46.0, "baseline_expenditure": 25.0, "cumulative_expenditure": 201.0, "velocity_multiplier": 2.1},
    {"project_id": 3, "agency_id": 1, "month": "August", "year": 2024, "month_index": 8, "actual_expenditure": 51.0, "baseline_expenditure": 26.0, "cumulative_expenditure": 252.0, "velocity_multiplier": 2.3},

    # Project 4 (Medium Risk)
    {"project_id": 4, "agency_id": 2, "month": "January", "year": 2024, "month_index": 1, "actual_expenditure": 20.0, "baseline_expenditure": 22.0, "cumulative_expenditure": 20.0, "velocity_multiplier": 0.9},
    {"project_id": 4, "agency_id": 2, "month": "February", "year": 2024, "month_index": 2, "actual_expenditure": 25.0, "baseline_expenditure": 24.0, "cumulative_expenditure": 45.0, "velocity_multiplier": 1.05},
    {"project_id": 4, "agency_id": 2, "month": "March", "year": 2024, "month_index": 3, "actual_expenditure": 30.0, "baseline_expenditure": 26.0, "cumulative_expenditure": 75.0, "velocity_multiplier": 1.15},
    {"project_id": 4, "agency_id": 2, "month": "April", "year": 2024, "month_index": 4, "actual_expenditure": 38.0, "baseline_expenditure": 28.0, "cumulative_expenditure": 113.0, "velocity_multiplier": 1.35},
    {"project_id": 4, "agency_id": 2, "month": "May", "year": 2024, "month_index": 5, "actual_expenditure": 44.0, "baseline_expenditure": 30.0, "cumulative_expenditure": 157.0, "velocity_multiplier": 1.45},
    {"project_id": 4, "agency_id": 2, "month": "June", "year": 2024, "month_index": 6, "actual_expenditure": 50.0, "baseline_expenditure": 32.0, "cumulative_expenditure": 207.0, "velocity_multiplier": 1.55},
    {"project_id": 4, "agency_id": 2, "month": "July", "year": 2024, "month_index": 7, "actual_expenditure": 56.0, "baseline_expenditure": 35.0, "cumulative_expenditure": 263.0, "velocity_multiplier": 1.6},
    {"project_id": 4, "agency_id": 2, "month": "August", "year": 2024, "month_index": 8, "actual_expenditure": 61.2, "baseline_expenditure": 38.0, "cumulative_expenditure": 324.2, "velocity_multiplier": 1.65},

    # Project 6 (Low Risk Baseline Benchmark)
    {"project_id": 6, "agency_id": 5, "month": "January", "year": 2024, "month_index": 1, "actual_expenditure": 10.0, "baseline_expenditure": 10.0, "cumulative_expenditure": 10.0, "velocity_multiplier": 1.0},
    {"project_id": 6, "agency_id": 5, "month": "February", "year": 2024, "month_index": 2, "actual_expenditure": 18.0, "baseline_expenditure": 18.0, "cumulative_expenditure": 28.0, "velocity_multiplier": 1.0},
    {"project_id": 6, "agency_id": 5, "month": "March", "year": 2024, "month_index": 3, "actual_expenditure": 27.0, "baseline_expenditure": 26.0, "cumulative_expenditure": 55.0, "velocity_multiplier": 1.04},
    {"project_id": 6, "agency_id": 5, "month": "April", "year": 2024, "month_index": 4, "actual_expenditure": 34.0, "baseline_expenditure": 33.0, "cumulative_expenditure": 89.0, "velocity_multiplier": 1.03},
    {"project_id": 6, "agency_id": 5, "month": "May", "year": 2024, "month_index": 5, "actual_expenditure": 41.0, "baseline_expenditure": 40.0, "cumulative_expenditure": 130.0, "velocity_multiplier": 1.02},
    {"project_id": 6, "agency_id": 5, "month": "June", "year": 2024, "month_index": 6, "actual_expenditure": 48.0, "baseline_expenditure": 47.0, "cumulative_expenditure": 178.0, "velocity_multiplier": 1.02},
    {"project_id": 6, "agency_id": 5, "month": "July", "year": 2024, "month_index": 7, "actual_expenditure": 53.0, "baseline_expenditure": 52.0, "cumulative_expenditure": 231.0, "velocity_multiplier": 1.01},
    {"project_id": 6, "agency_id": 5, "month": "August", "year": 2024, "month_index": 8, "actual_expenditure": 58.0, "baseline_expenditure": 57.0, "cumulative_expenditure": 289.0, "velocity_multiplier": 1.02},
]

# Default Anomalies (Ranked by Score Descending)
INITIAL_ANOMALIES = [
    # Hero Critical Anomaly
    {
        "id": 1,
        "project_id": 1,
        "agency_id": 1,
        "work_id": "MPLADS-2024-MH-4011",
        "category": "Healthcare",
        "current_expenditure": 79.0,
        "historical_baseline": 44.0,
        "z_score": 3.7,
        "iqr_status": "Flagged",
        "spending_velocity": 4.2,
        "historical_deviation": 79.5,
        "anomaly_score": 92.0,
        "risk_level": "Critical",
        "score_components": json.dumps({
            "z_score_weighted": 28.5,
            "iqr_weighted": 20.0,
            "velocity_weighted": 28.0,
            "deviation_weighted": 15.5,
            "weights": {"z_score": 0.30, "iqr": 0.20, "velocity": 0.30, "deviation": 0.20}
        }),
        "reason": "Current expenditure is substantially above the historical agency baseline. The Z-score exceeds the configured threshold, the value is outside the IQR range, and recent spending velocity is significantly higher than the historical average."
    },
    # High Anomaly 2
    {
        "id": 2,
        "project_id": 2,
        "agency_id": 4,
        "work_id": "MPLADS-2024-KA-1082",
        "category": "Water Supply",
        "current_expenditure": 64.5,
        "historical_baseline": 35.0,
        "z_score": 2.85,
        "iqr_status": "Flagged",
        "spending_velocity": 2.6,
        "historical_deviation": 84.3,
        "anomaly_score": 76.5,
        "risk_level": "High",
        "score_components": json.dumps({
            "z_score_weighted": 23.5,
            "iqr_weighted": 20.0,
            "velocity_weighted": 17.5,
            "deviation_weighted": 15.5,
            "weights": {"z_score": 0.30, "iqr": 0.20, "velocity": 0.30, "deviation": 0.20}
        }),
        "reason": "Unusual acceleration detected in municipal water installation. Current expenditure diverges +84.3% from historical baseline, with spending velocity reaching 2.6× historical rate."
    },
    # High Anomaly 3
    {
        "id": 3,
        "project_id": 3,
        "agency_id": 1,
        "work_id": "MPLADS-2024-MH-2034",
        "category": "Education",
        "current_expenditure": 51.0,
        "historical_baseline": 26.0,
        "z_score": 2.64,
        "iqr_status": "Flagged",
        "spending_velocity": 2.3,
        "historical_deviation": 96.2,
        "anomaly_score": 68.0,
        "risk_level": "High",
        "score_components": json.dumps({
            "z_score_weighted": 21.0,
            "iqr_weighted": 20.0,
            "velocity_weighted": 14.5,
            "deviation_weighted": 12.5,
            "weights": {"z_score": 0.30, "iqr": 0.20, "velocity": 0.30, "deviation": 0.20}
        }),
        "reason": "High variance flagged in educational center digitization disbursements. Spending is 96.2% above baseline with repeated multi-voucher batches."
    },
    # Medium Anomaly 4
    {
        "id": 4,
        "project_id": 4,
        "agency_id": 2,
        "work_id": "MPLADS-2024-KA-3045",
        "category": "Roads & Infrastructure",
        "current_expenditure": 61.2,
        "historical_baseline": 38.0,
        "z_score": 2.15,
        "iqr_status": "Normal",
        "spending_velocity": 1.65,
        "historical_deviation": 61.0,
        "anomaly_score": 54.0,
        "risk_level": "Medium",
        "score_components": json.dumps({
            "z_score_weighted": 16.5,
            "iqr_weighted": 0.0,
            "velocity_weighted": 15.0,
            "deviation_weighted": 12.5,
            "weights": {"z_score": 0.30, "iqr": 0.20, "velocity": 0.30, "deviation": 0.20}
        }),
        "reason": "Moderate baseline deviation observed in bridge culvert approach spending. Z-score (2.15) exceeds normal variance envelope; physical verification recommended."
    },
    # Medium Anomaly 5
    {
        "id": 5,
        "project_id": 5,
        "agency_id": 6,
        "work_id": "MPLADS-2024-DL-5099",
        "category": "Education",
        "current_expenditure": 94.0,
        "historical_baseline": 65.0,
        "z_score": 1.95,
        "iqr_status": "Normal",
        "spending_velocity": 1.45,
        "historical_deviation": 44.6,
        "anomaly_score": 48.5,
        "risk_level": "Medium",
        "score_components": json.dumps({
            "z_score_weighted": 15.0,
            "iqr_weighted": 0.0,
            "velocity_weighted": 13.5,
            "deviation_weighted": 10.0,
            "weights": {"z_score": 0.30, "iqr": 0.20, "velocity": 0.30, "deviation": 0.20}
        }),
        "reason": "Moderate spend acceleration (+44.6% deviation) noted during terminal equipment procurement phase."
    },
    # Low Anomaly 6
    {
        "id": 6,
        "project_id": 11,
        "agency_id": 3,
        "work_id": "MPLADS-2024-MH-1255",
        "category": "Public Amenities",
        "current_expenditure": 46.0,
        "historical_baseline": 35.0,
        "z_score": 1.45,
        "iqr_status": "Normal",
        "spending_velocity": 1.3,
        "historical_deviation": 31.4,
        "anomaly_score": 38.0,
        "risk_level": "Medium",
        "score_components": json.dumps({
            "z_score_weighted": 12.0,
            "iqr_weighted": 0.0,
            "velocity_weighted": 10.0,
            "deviation_weighted": 6.0,
            "weights": {"z_score": 0.30, "iqr": 0.20, "velocity": 0.30, "deviation": 0.20}
        }),
        "reason": "Minor velocity increase noted during cold chain machinery acquisition. Routine monitoring maintained."
    },
    # Low Anomaly 7
    {
        "id": 7,
        "project_id": 13,
        "agency_id": 2,
        "work_id": "MPLADS-2024-KA-1477",
        "category": "Sanitation",
        "current_expenditure": 62.0,
        "historical_baseline": 48.0,
        "z_score": 1.35,
        "iqr_status": "Normal",
        "spending_velocity": 1.25,
        "historical_deviation": 29.1,
        "anomaly_score": 28.0,
        "risk_level": "Low",
        "score_components": json.dumps({
            "z_score_weighted": 8.0,
            "iqr_weighted": 0.0,
            "velocity_weighted": 6.0,
            "deviation_weighted": 4.0,
            "weights": {"z_score": 0.30, "iqr": 0.20, "velocity": 0.30, "deviation": 0.20}
        }),
        "reason": "Spend profile remains within acceptable tolerance limits for seasonal canal desiltation works."
    }
]

# Verification Cases (Covering all requested statuses: Submitted, Under Review, Verified, Rejected, Resolved)
INITIAL_VERIFICATION_CASES = [
    # Case for Project 1 (Hero Critical Anomaly: Under Review)
    {
        "id": 1,
        "case_id": "VER-2024-MH-001",
        "project_id": 1,
        "agency_id": 1,
        "anomaly_id": 1,
        "work_id": "MPLADS-2024-MH-4011",
        "anomaly_score": 92.0,
        "risk_level": "Critical",
        "status": "Under Review", # Active demo state
        "reviewer": "Dr. Aniruddha Kulkarni, District Nodal Auditor",
        "comment": "Rapid spike of ₹35L in 60 days flagged by statistical model. Discrepancy observed between 48% physical structural progress and 83% financial utilization. Physical milestone audit initiated.",
        "remarks": "Interim inspection team dispatched to Pune site. Contractor requested to supply itemized procurement invoices for ICU diagnostic machinery.",
        "submitted_date": datetime(2024, 8, 12, 10, 30)
    },
    # Case 2: Submitted
    {
        "id": 2,
        "case_id": "VER-2024-KA-002",
        "project_id": 2,
        "agency_id": 4,
        "anomaly_id": 2,
        "work_id": "MPLADS-2024-KA-1082",
        "anomaly_score": 76.5,
        "risk_level": "High",
        "status": "Submitted",
        "reviewer": "P. Ramesh Rao, Zilla Panchayat Vigilance Officer",
        "comment": "Disbursement velocity accelerated to 2.6x against historical average. RO plant machinery cost claims require physical delivery confirmation.",
        "remarks": "Case opened following automated anomaly engine trigger. Awaiting field inspector assignment.",
        "submitted_date": datetime(2024, 8, 15, 14, 20)
    },
    # Case 3: Verified (Validated legitimately)
    {
        "id": 3,
        "case_id": "VER-2024-MH-003",
        "project_id": 3,
        "agency_id": 1,
        "anomaly_id": 3,
        "work_id": "MPLADS-2024-MH-2034",
        "anomaly_score": 68.0,
        "risk_level": "High",
        "status": "Verified",
        "reviewer": "Sunita Deshmukh, Chief Accounts Officer",
        "comment": "Audit completed. Sudden expenditure surge of ₹22L was verified against authorized advance payment for centralized bulk purchase of computer hardware and solar units under state educational mandate.",
        "remarks": "Field engineer submitted geocoded photos and OEM delivery challans. Spending justified by sanctioned milestone variation order.",
        "submitted_date": datetime(2024, 7, 20, 11, 00)
    },
    # Case 4: Rejected (Unsubstantiated claims)
    {
        "id": 4,
        "case_id": "VER-2024-KA-004",
        "project_id": 4,
        "agency_id": 2,
        "anomaly_id": 4,
        "work_id": "MPLADS-2024-KA-3045",
        "anomaly_score": 54.0,
        "risk_level": "Medium",
        "status": "Rejected",
        "reviewer": "Harish Gowda, Divisional Technical Officer",
        "comment": "Supplementary bill claim of ₹14.2L rejected due to duplicate material billing and absence of valid cubic-meter concrete test certifications.",
        "remarks": "Agency directed to rectify measurement book entry. Payment withheld until compliance.",
        "submitted_date": datetime(2024, 6, 18, 16, 45)
    },
    # Case 5: Resolved
    {
        "id": 5,
        "case_id": "VER-2024-DL-005",
        "project_id": 5,
        "agency_id": 6,
        "anomaly_id": 5,
        "work_id": "MPLADS-2024-DL-5099",
        "anomaly_score": 48.5,
        "risk_level": "Medium",
        "status": "Resolved",
        "reviewer": "Vikas Sharma, Directorate of Audit",
        "comment": "Verification concluded. All 60 computer terminals and solar inverter installations verified on-site. Inventory register reconciled.",
        "remarks": "Final completion certificate issued. Case closed successfully.",
        "submitted_date": datetime(2024, 5, 25, 9, 15)
    }
]

# Evidence Records with SHA-256 Hashes
INITIAL_EVIDENCE = [
    {
        "id": 1,
        "verification_id": 1,
        "file_name": "pune_trauma_icu_wing_foundation_audit.jpg",
        "file_hash": calculate_sha256("pune_trauma_icu_wing_foundation_audit_content_2024_08_14"),
        "file_url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "timestamp": datetime(2024, 8, 14, 11, 45),
        "comment": "Site inspection photo of ICU block: RCC framework partially complete (48%), interior partitions and medical gas pipeline installation pending.",
        "is_verified": True
    },
    {
        "id": 2,
        "verification_id": 1,
        "file_name": "trauma_diagnostic_equipment_challan.pdf",
        "file_hash": calculate_sha256("trauma_diagnostic_equipment_challan_verified_document_2024"),
        "file_url": "https://images.unsplash.com/photo-1586772008403-1288544c2eb5?auto=format&fit=crop&w=800&q=80",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "timestamp": datetime(2024, 8, 14, 12, 10),
        "comment": "Supplier invoice #MED-2024-998 submitted by executing agency; currently awaiting serial number verification against warehouse ledger.",
        "is_verified": True
    },
    {
        "id": 3,
        "verification_id": 3,
        "file_name": "nagpur_anganwadi_digitization_tablets_delivered.jpg",
        "file_hash": calculate_sha256("nagpur_anganwadi_digitization_tablets_verified_hash_2024"),
        "file_url": "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80",
        "latitude": 21.1458,
        "longitude": 79.0882,
        "timestamp": datetime(2024, 7, 22, 14, 30),
        "comment": "Delivery verification photo confirming 60 interactive learning tablets and solar charging docking stations at Model Anganwadi center.",
        "is_verified": True
    }
]

# Initial Data Quality Import Record
INITIAL_DATA_IMPORT = {
    "id": 1,
    "filename": "mplads_master_expenditure_dataset_q2_2024.csv",
    "source": "MPLADS Integrated State Monitoring Cell (Demo Baseline)",
    "rows_imported": 18,
    "rows_processed": 18,
    "missing_fields": 0,
    "duplicate_records": 0,
    "invalid_dates": 0,
    "invalid_amounts": 0,
    "normalized_agencies": 7,
    "status": "Success",
    "report_json": json.dumps({
        "data_origin": "Centralized Demo Baseline for Hackathon Verification",
        "validation_passed": True,
        "geo_encoded_projects": 18,
        "active_anomalies_detected": 7
    }),
    "created_at": datetime.utcnow()
}

INITIAL_SETTINGS = [
    {"key": "z_score_threshold", "value": "3.0", "description": "Configurable threshold for Z-score flag"},
    {"key": "iqr_multiplier", "value": "1.5", "description": "IQR outlier dispersion multiplier"},
    {"key": "weight_zscore", "value": "0.30", "description": "Weight of Z-score in composite score (30%)"},
    {"key": "weight_iqr", "value": "0.20", "description": "Weight of IQR status in composite score (20%)"},
    {"key": "weight_velocity", "value": "0.30", "description": "Weight of spending velocity in composite score (30%)"},
    {"key": "weight_deviation", "value": "0.20", "description": "Weight of historical deviation in composite score (20%)"}
]

def seed_database(db: Session, force: bool = False):
    """
    Idempotent database seeder. Populates default data if tables are empty.
    """
    project_count = db.query(Project).count()
    if project_count > 0 and not force:
        return

    if force:
        # Clean existing records
        db.query(Evidence).delete()
        db.query(VerificationCase).delete()
        db.query(Anomaly).delete()
        db.query(SpendingRecord).delete()
        db.query(Project).delete()
        db.query(Agency).delete()
        db.query(DataImport).delete()
        db.query(SystemSetting).delete()
        db.commit()

    # 1. Agencies
    for ag_data in INITIAL_AGENCIES:
        db.add(Agency(**ag_data))
    db.commit()

    # 2. Projects
    for prj_data in INITIAL_PROJECTS:
        db.add(Project(**prj_data))
    db.commit()

    # 3. Spending Records
    for sp_data in HISTORICAL_SPENDING:
        db.add(SpendingRecord(**sp_data))
    db.commit()

    # 4. Anomalies
    for an_data in INITIAL_ANOMALIES:
        db.add(Anomaly(**an_data))
    db.commit()

    # 5. Verification Cases
    for vc_data in INITIAL_VERIFICATION_CASES:
        db.add(VerificationCase(**vc_data))
    db.commit()

    # 6. Evidence
    for ev_data in INITIAL_EVIDENCE:
        db.add(Evidence(**ev_data))
    db.commit()

    # 7. Data Import Log
    db.add(DataImport(**INITIAL_DATA_IMPORT))
    db.commit()

    # 8. Settings
    for st_data in INITIAL_SETTINGS:
        db.add(SystemSetting(**st_data))
    db.commit()

    print(">>> FundWatch database successfully seeded with centralized demo dataset.")
