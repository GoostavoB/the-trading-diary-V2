import { GoalWidget } from '@/components/goals/GoalWidget';

export function GoalsContent() {
  return (
    <div 
      className="animate-in fade-in-50 duration-500"
      style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}
    >
      <GoalWidget />
    </div>
  );
}
