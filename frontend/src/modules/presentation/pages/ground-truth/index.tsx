import { Feature, On, Default, Loading } from 'space-react-client';
import Iconify from '../../../core/components/iconify';

export default function GroundTruthPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-sphere-grey-900">Ground Truth</h1>
      <p className="mb-8 text-sm text-sphere-grey-500">
        Reference data and validation benchmarks for pricing models.
      </p>

      <Feature id="sphere-groundTruth">
        <On>
          <div className="rounded-lg border border-sphere-grey-200 bg-white p-8 text-center text-sphere-grey-400">
            <Iconify icon="mdi:check-decagram-outline" width={40} className="mx-auto mb-3 text-sphere-primary-400" />
            <p className="text-sm">Ground Truth content coming soon.</p>
          </div>
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
