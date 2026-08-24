import { GameUploadScreen } from '../../components/GameUploadScreen';

/** Pushed from the team profile. Coach uploads land pending an admin's review. */
export default function CoachGameUpload() {
  return <GameUploadScreen backTo="/coach/profile" />;
}
