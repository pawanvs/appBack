const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const verificationId = uuidv4();

const payload = {
  verificationId,
  ...{
    purchaseOrder: "86883912",
    company: "Emergency Roadside Service",
    dispatcher: "Harry",
    customerName: "Ayed Mohamed",
    customerPhone: "+1 (623) 570-7761",
    vehicleModel: "2019 Mercedes-Benz Amg G Class",
    serviceCategory: "RoadSideService",
    reason: "Tire Service",
    towSource: "20207 N 13th Ave, Phoenix, AZ 85027, USA",
    towDestination: "N/A",
    notes: "ADDITIONAL NOTES...",
    towReportId: "67d7c9c29b17c3a2e841aee3",
    webhookUrl: "https://localhost/api/verificationResult"
  }
};

(async () => {
  try {
    const res = await axios.post('https://a.v.c.d/api/verifyCustomerInfo', payload);
    console.log('✅ Request sent. Response:', res.data);
  } catch (err) {
    console.error('❌ Failed to send verification request:', err.message);
  }
})();
