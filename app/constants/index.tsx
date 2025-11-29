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


