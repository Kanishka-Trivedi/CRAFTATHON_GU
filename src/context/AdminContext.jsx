"use client";
import React, { createContext, useContext, useState } from 'react';
import { dummyUsers, dummyAlerts, dummySessions } from '../data/dummy';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [users, setUsers] = useState(dummyUsers);
  const [alerts, setAlerts] = useState(dummyAlerts);
  const [sessions, setSessions] = useState(dummySessions);
  const [stats, setStats] = useState({
    totalSessions: 1204,
    anomalyAlerts: 17,
    blockedUsers: 3,
    avgTrustScore: 94.2
  });

  return (
    <AdminContext.Provider value={{ users, setUsers, alerts, setAlerts, sessions, setSessions, stats, setStats }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
