import { Feature, On, Default, Loading } from 'space-react-client';
import Iconify from '../../../core/components/iconify';
import GroundTruthPlayground from './GroundTruthPlayground';

export default function GroundTruthPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">

      <Feature id="sphere-groundTruth">
        <On>
          <GroundTruthPlayground />
        </On>
        <Default>
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <Iconify icon="mdi:lock-outline" width={20} className="mt-0.5 shrink-0" />
            <span>
              <strong>Ground Truth</strong> requires the Ground Truth add-on. Purchase it from your
              organization's settings to unlock access.
            </span>
          </div>
        </Default>
        <Loading>{null}</Loading>
      </Feature>
    </div>
  );
}
