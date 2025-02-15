import { Badge } from '@mui/material';
import useTasks from 'components/nexus/hooks/useTasks';
import { useUser } from 'hooks/useUser';

export default function NotificationsBadge ({ children }: { children: JSX.Element }) {

  const { user } = useUser();
  const { tasks } = useTasks();

  const userNotificationState = user?.notificationState;

  const voteTasks = tasks?.votes.length ?? 0;
  const mentionTasks = tasks?.mentioned.unmarked.length ?? 0;
  // If the user has snoozed multisig tasks don't count them
  const excludeGnosisTasks = userNotificationState?.snoozedUntil && new Date(userNotificationState.snoozedUntil) > new Date();
  const gnosisTasks = excludeGnosisTasks ? 0 : tasks?.gnosis.length ?? 0;

  const totalTasks = voteTasks + mentionTasks + gnosisTasks;

  return (
    <Badge
      badgeContent={totalTasks}
      overlap='circular'
      color='error'
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      max={99}
    >
      {children}
    </Badge>
  );
}
