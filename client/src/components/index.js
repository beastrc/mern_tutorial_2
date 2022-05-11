import Role from './role/Role';

import LegablyHeader from './shared/header/Header';
import LegablyFooter from './shared/footer/Footer';
import LegablyLargeFooter from './shared/footer/LargeFooter';
import Loader from './shared/loader/Loader';
import FlashMsg from './shared/flash-msg/FlashMsg';

import AvatarCropper from  './shared/plugins/cropper/AvatarCropper';
import AvatarFileUpload from  './shared/plugins/cropper/AvatarFileUpload';
import Mask from './shared/plugins/mask/Mask';

import Dashboard from './dashboard/Index';
import Job from './dashboard/shared/Job';
import Ref from './dashboard/shared/Ref';
import Candidate from './dashboard/shared/Candidate';
import JobStepsView from './dashboard/shared/JobStepsView';
import NoRecordFound from './dashboard/shared/NoRecordFound';
import CreateStripeAccount from './dashboard/shared/CreateStripeAccount';

import PostJobComp from './dashboard/poster-jobs/shared/PostJobComp';
import PostRefComp from './dashboard/poster-referrals/PostRefComp';

module.exports = {
  Role,
  LegablyHeader,
  LegablyFooter,
  LegablyLargeFooter,
  Loader,
  FlashMsg,
  AvatarCropper,
  AvatarFileUpload,
  Mask,
  Dashboard,
  Job,
  Ref,
  Candidate,
  JobStepsView,
  NoRecordFound,
  CreateStripeAccount,
  PostJobComp,
  PostRefComp,
}
