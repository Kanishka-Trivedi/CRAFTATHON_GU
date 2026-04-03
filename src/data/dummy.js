export const dummyUser = {
  name: "Rahul Mehta",
  email: "rahul.mehta@gmail.com",
  avatar: "RM",
  balance: 0,
  accountNo: "•••• •••• 4829",
  phone: "+91 98765 43210"
};

export const dummyTransactions = [
  { id: 1, merchant: "Swiggy", category: "Food", amount: -840, timestamp: "2024-04-03 12:30", status: "Completed", score: 0.92 },
  { id: 2, merchant: "Amazon India", category: "Shopping", amount: -4500, timestamp: "2024-04-03 10:15", status: "Completed", score: 0.88 },
  { id: 3, merchant: "Salary Credit", category: "Income", amount: 120000, timestamp: "2024-04-01 09:00", status: "Completed", score: 0.95 },
  { id: 4, merchant: "HDFC Transfer", category: "Transfer", amount: -15000, timestamp: "2024-03-28 14:20", status: "Completed", score: 0.85 },
  { id: 5, merchant: "Netflix", category: "Entertainment", amount: -499, timestamp: "2024-03-25 00:05", status: "Completed", score: 0.91 },
  { id: 6, merchant: "BigBazaar", category: "Shopping", amount: -3200, timestamp: "2024-03-24 18:45", status: "Completed", score: 0.89 },
  { id: 7, merchant: "Zomato", category: "Food", amount: -650, timestamp: "2024-03-22 20:10", status: "Completed", score: 0.94 },
  { id: 8, merchant: "Flipkart", category: "Shopping", amount: -1200, timestamp: "2024-03-20 11:30", status: "Completed", score: 0.87 },
  { id: 9, merchant: "Uber", category: "Travel", amount: -450, timestamp: "2024-03-18 08:15", status: "Completed", score: 0.90 },
  { id: 10, merchant: "Airtel Bill", category: "Bills", amount: -999, timestamp: "2024-03-15 10:00", status: "Completed", score: 0.93 },
  { id: 11, merchant: "PhonePe", category: "Transfer", amount: -500, timestamp: "2024-03-12 16:45", status: "Completed", score: 0.84 },
  { id: 12, merchant: "SBI Transfer", category: "Transfer", amount: -10000, timestamp: "2024-03-10 12:00", status: "Completed", score: 0.86 },
  { id: 13, merchant: "DMart", category: "Shopping", amount: -5600, timestamp: "2024-03-08 19:30", status: "Completed", score: 0.91 },
  { id: 14, merchant: "BookMyShow", category: "Entertainment", amount: -1200, timestamp: "2024-03-05 14:15", status: "Completed", score: 0.92 },
  { id: 15, merchant: "Jio Fiber", category: "Bills", amount: -1179, timestamp: "2024-03-02 10:00", status: "Completed", score: 0.94 },
  { id: 16, merchant: "ICICI Bank", category: "Transfer", amount: -25000, timestamp: "2024-02-28 11:00", status: "Completed", score: 0.88 },
  { id: 17, merchant: "Myntra", category: "Shopping", amount: -3400, timestamp: "2024-02-25 15:30", status: "Completed", score: 0.90 },
  { id: 18, merchant: "Ola Cabs", category: "Travel", amount: -320, timestamp: "2024-02-22 09:45", status: "Completed", score: 0.89 },
  { id: 19, merchant: "Dunzo", category: "Food", amount: -150, timestamp: "2024-02-20 18:20", status: "Completed", score: 0.92 },
  { id: 20, merchant: "PVR Cinemas", category: "Entertainment", amount: -1800, timestamp: "2024-02-18 20:00", status: "Completed", score: 0.93 },
];

export const dummyUsers = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: ["Amit Sharma", "Sanya Iyer", "Vikram Singh", "Priya Patel", "Arjun Reddy", "Meera Nair", "Rohan Gupta", "Ananya Das", "Siddharth Jain", "Tanvi Joshi", "Rahul Mehta", "Kavita Rao", "Sameer Sheikh", "Neha Kapoor", "Varun Malhotra", "Ishani Verma", "Aditya Bose", "Kiara Advani", "Yash Chopra", "Deepika Padukone"][i],
  email: `user${i + 1}@example.com`,
  accountNo: `•••• •••• ${1000 + Math.floor(Math.random() * 9000)}`,
  trustScore: (0.7 + Math.random() * 0.3).toFixed(2),
  status: ["Enrolled", "Enrolled", "Anomaly", "Blocked", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled", "Enrolled"][i],
  lastActive: "2h ago",
  avatar: ["AS", "SI", "VS", "PP", "AR", "MN", "RG", "AD", "SJ", "TJ", "RM", "KR", "SS", "NK", "VM", "IV", "AB", "KA", "YC", "DP"][i]
}));

export const dummyAlerts = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  time: "2024-04-03 14:23:47",
  user: "Rahul Mehta",
  riskScore: (Math.random() * 0.5 + 0.4).toFixed(2),
  trigger: ["Typing pattern anomaly", "Flight time deviation", "Unusual navigation rhythm", "Device orientation change", "Swipe velocity spike"][Math.floor(Math.random() * 5)],
  action: ["Re-auth requested", "Session flagged", "Transfer blocked"][Math.floor(Math.random() * 3)],
  status: ["Resolved", "Pending", "Escalated"][Math.floor(Math.random() * 3)],
  severity: i % 5 === 0 ? "Critical" : (i % 3 === 0 ? "High" : "Medium")
}));

export const dummySessions = [
  {
    id: "sess_93812",
    user: "Rahul Mehta",
    startTime: "14:20:01",
    device: "Chrome 124 · Android · Mumbai, IN",
    anomalyScore: 0.78,
    duration: "4m 32s",
    trustData: Array.from({ length: 120 }, (_, i) => {
      if (i > 85 && i < 100) return 0.3 + Math.random() * 0.1;
      return 0.8 + Math.random() * 0.15;
    })
  }
];

export const dummyBehaviourProfile = {
  baseline: [85, 90, 75, 80, 70, 85],
  user: [92, 88, 85, 82, 78, 90],
  metrics: [
    { name: "Typing Speed", value: "65 WPM", status: "Normal", trend: [10, 15, 8, 12, 14, 11, 13, 10, 9, 12] },
    { name: "Key Hold Time", value: "142ms", status: "Normal", trend: [5, 4, 6, 5, 4, 7, 5, 4, 6, 5] },
    { name: "Flight Time", value: "210ms", status: "Normal", trend: [8, 9, 7, 8, 10, 9, 8, 7, 9, 8] },
    { name: "Swipe Velocity", value: "2.4 m/s", status: "Normal", trend: [12, 11, 13, 14, 12, 11, 10, 12, 11, 13] },
    { name: "Tap Pressure", value: "Medium", status: "Normal", trend: [3, 4, 3, 3, 4, 3, 4, 3, 3, 4] },
    { name: "Navigation Flow", value: "Smooth", status: "Normal", trend: [15, 14, 15, 16, 15, 14, 15, 15, 14, 15] },
  ]
};
