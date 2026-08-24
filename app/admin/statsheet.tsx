import { GameUploadScreen } from '../../components/GameUploadScreen';

/** Admins upload on a team's behalf, and their uploads land approved. */
export default function AdminGameUpload() {
  return <GameUploadScreen backTo="/admin" />;
}
