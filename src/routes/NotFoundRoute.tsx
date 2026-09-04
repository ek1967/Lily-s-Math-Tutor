import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
import { paths } from '@/router';

export function NotFoundRoute() {
  return (
    <Card className="mt-10 text-center">
      <p className="text-lg">הדף הזה לא נמצא.</p>
      <Link to={paths.home()} className="mt-3 inline-block text-primary underline">
        חזרה לדף הבית
      </Link>
    </Card>
  );
}
