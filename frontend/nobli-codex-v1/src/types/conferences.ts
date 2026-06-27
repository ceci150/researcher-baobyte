export interface Conference {
  id: string;
  name: string;
  deadline: string;
  fit: 'strong' | 'good' | 'reach';
  note: string;
}
