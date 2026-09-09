import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  clients as initialClients, Client,
  activities as initialActivities, Activity,
  deals as initialDeals, Deal, Stage,
  projects as initialProjects, Project,
  clientEvents as initialClientEvents, ClientEvent,
  members as initialMembers, Member
} from './crm-data';

interface CRMContextType {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  deals: Deal[];
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  clientEvents: ClientEvent[];
  setClientEvents: React.Dispatch<React.SetStateAction<ClientEvent[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [clientEvents, setClientEvents] = useState<ClientEvent[]>(initialClientEvents);
  const [members, setMembers] = useState<Member[]>(initialMembers);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('eray_crm_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.activities) setActivities(parsed.activities);
        if (parsed.deals) setDeals(parsed.deals);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.clientEvents) setClientEvents(parsed.clientEvents);
        if (parsed.members) setMembers(parsed.members);
      }
    } catch(e) {
      console.error(e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('eray_crm_data', JSON.stringify({
      clients, activities, deals, projects, clientEvents, members
    }));
  }, [clients, activities, deals, projects, clientEvents, members, isLoaded]);

  // Prevent flicker before hydration
  if (!isLoaded) return null;

  return (
    <CRMContext.Provider value={{
      clients, setClients,
      activities, setActivities,
      deals, setDeals,
      projects, setProjects,
      clientEvents, setClientEvents,
      members, setMembers
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) throw new Error("useCRM must be used within CRMProvider");
  return context;
}

