// Usuarios de demostración. Las credenciales deben coincidir con el README (TS-005).
import { DestinationType, DocumentType, TravelStyle } from '@prisma/client';

export const DEMO_PASSWORD = 'Demo1234!';

export interface DemoClientSeed {
  key: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  documentType: DocumentType;
  documentNumber: string;
  travelStyle: TravelStyle | null;
  destinationType: DestinationType | null;
}

export const DEMO_CLIENTS: DemoClientSeed[] = [
  { key: 'nuevo',   email: 'lucia.ramos@demo.pe',   firstName: 'Lucía',   lastName: 'Ramos',   phone: '+51 987 100 200', dateOfBirth: '2000-05-12', documentType: 'DNI', documentNumber: '70000001', travelStyle: null,      destinationType: null },
  { key: 'viajero', email: 'diego.salazar@demo.pe',  firstName: 'Diego',   lastName: 'Salazar', phone: '+51 987 300 400', dateOfBirth: '1995-09-03', documentType: 'DNI', documentNumber: '70000002', travelStyle: 'PAREJA',  destinationType: 'PLAYA' },
  { key: 'elite',   email: 'valeria.torres@demo.pe', firstName: 'Valeria', lastName: 'Torres',  phone: '+51 987 500 600', dateOfBirth: '1988-02-21', documentType: 'DNI', documentNumber: '70000003', travelStyle: 'FAMILIA', destinationType: 'CULTURA' },
];
