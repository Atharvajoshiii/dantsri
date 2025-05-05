// types/teeth-chart.d.ts

declare module '@/components/TeethChart' {
    export interface ToothData {
      id: number;
      type: string;
      category: 'Permanent' | 'Deciduous';
    }
    
    interface TeethChartProps {
      onTeethSelected: (selectedTeeth: ToothData[]) => void;
    }
    
    const TeethChart: React.FC<TeethChartProps>;
    export default TeethChart;
  }