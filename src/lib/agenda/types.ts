export type WeeklyShift = {
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

export type VetSchedule = {
  monday: WeeklyShift;
  tuesday: WeeklyShift;
  wednesday: WeeklyShift;
  thursday: WeeklyShift;
  friday: WeeklyShift;
  saturday: WeeklyShift;
  sunday: WeeklyShift;
};

export type Vet = {
  id: string;
  name: string;
  schedule: VetSchedule;
};

export type Room = {
  id: string;
  name: string;
};

export type VisitType = {
  id: string;
  label: string;
  duration: number;
};

export type AgendaSettings = {
  clinicName: string;
  slotMinutes: number;
  vets: Vet[];
  rooms: Room[];
  visitTypes: VisitType[];
};

export type VetScheduleOverride = {
  id: string;
  vetId: string;
  date: string;
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
  reason: string;
};

export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "completed"
  | "cancelled";

export type AgendaAppointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;

  // Veterinario principale
  vetId: string;
  vetName: string;

  // Tutti i veterinari coinvolti
  assignedVetIds: string[];
  assignedVetNames: string[];

  roomId: string;
  roomName: string;

  animalId: string;
  animalName: string;
  ownerName: string;

  visitTypeId: string;
  visitTypeLabel: string;
  duration: number;

  notes: string;
  status: AppointmentStatus;

  createdAt: string;
  updatedAt: string;
};
