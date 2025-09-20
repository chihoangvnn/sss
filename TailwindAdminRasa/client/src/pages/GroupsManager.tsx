import { GroupsManagerPanel } from "../components/GroupsManagerPanel";

export default function GroupsManager() {
  return (
    <div className="p-6" data-testid="page-groups-manager">
      <GroupsManagerPanel />
    </div>
  );
}