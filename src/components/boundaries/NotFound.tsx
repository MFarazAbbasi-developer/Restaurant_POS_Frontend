import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex items-center justify-center p-6 bg-pos-bg text-pos-text select-none">
      <Card className="max-w-md w-full text-center p-8">
        <div className="text-6xl font-black text-pos-accent mb-2">404</div>
        <h1 className="text-xl font-bold mb-2">Screen Not Found</h1>
        <p className="text-sm text-pos-text-muted mb-6">
          The requested POS route or terminal screen does not exist.
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      </Card>
    </div>
  );
};
