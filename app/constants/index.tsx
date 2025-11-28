import { Calendar1, CalendarClock, Church, CircleUserRound, NotebookPen, Settings } from "lucide-react"; 

export enum FormFieldType {
    INPUT = 'input',
    TEXT_AREA = 'textarea',
    PHONE_INPUT = 'phoneInput',
    CHECKBOX = 'checkbox',
    DATE_PICKER = 'datePicker',
    SELECT = 'select',
    SKELETON = 'skeleton',
    PASSWORD = 'password',
    TIME = 'time'
  
  }

  interface HeaderType {
    name: string, 
    href: string
  }

  export const HeaderContent  = (isAuthenticated?: boolean) : HeaderType[] => [
    {
      name: 'Home',
      href: '/'
    },
    {
      name: 'Soumettre',
      href: '/prayer'
    },
    {
      name: 'Témoignage',
      href: '/community'
    },
    {
      name: isAuthenticated? 'Tableau de board' : '',
      href: isAuthenticated? '/dashboard' : ''
    },
  ]


interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

  
export const NavbarType = (isIntercesseur?: boolean, isManager?: boolean): NavItem[] => {
  const userNav: NavItem[] = [
    { name: 'Prière', href: '/dashboard/user/prayer', icon: <Church  /> },
    { name: 'Profile', href: '/dashboard/user/profile', icon: <CircleUserRound /> },
  ];

  const intercesseurNav: NavItem[] = [
    { name: 'Disponibilité', href: '/dashboard/user/intercessor/availability', icon: <Calendar1 /> },
    { name: 'Planing', href: '/dashboard/user/intercessor/planing', icon: <NotebookPen /> },
    // { name: 'Rendez-vous', href: '/dashboard/member/rdv', icon: <CalendarClock color="gray" /> },
  ];

  const managerNav: NavItem[] = [
    { name: 'Toutes les prières', href: '/dashboard/user/manager/prayer', icon: <Church  /> },
    { name: 'Gestion membres', href: '/dashboard/user/manager/member', icon: <Settings/> },
  ];

  return [
    ...userNav,
    ...(isIntercesseur ? intercesseurNav : []),
    ...(isManager ? [...intercesseurNav, ...managerNav, ] : []),
  ];
};