'use client';

import { useState } from 'react';
import {
  Brain,
  Target,
  BarChart3,
  Grid,
  FileImage,
  CheckCircle2,
  Sparkles,
  Award,
  AlertCircle,
  Hash,
  Activity,
  Layers
} from 'lucide-react';
import { useT } from '@/i18n/LocaleProvider';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  ResponsiveContainer,
  ErrorBar
} from 'recharts';

type GalleryImageProps = {
  src: string;
  alt: string;
  caption: string;
};

function GalleryImage({ src, alt, caption }: GalleryImageProps) {
  const { t } = useT();
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-xl h-56 flex flex-col items-center justify-center text-center p-4">
        <FileImage className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('ml.plotUnavailable')}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[180px] break-all">{alt}</p>
      </div>
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg ring-1 ring-zinc-800 hover:ring-blue-500/40 hover:shadow-blue-500/10 transition-all flex flex-col"
      title={t('ml.openFullSize')}
    >
      <div className="p-4 flex items-center justify-center h-64 bg-white dark:bg-slate-900">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setHasError(true)}
          className="max-h-full max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
        />
      </div>
      <div className="p-3 bg-slate-50 dark:bg-[#060b1a] border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 transition-colors">{caption}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{alt}</p>
      </div>
    </a>
  );
}

const CustomPermutationTooltip = ({ active, payload }: any) => {
  // Tooltip is rendered by Recharts outside React tree, but useT works fine
  // here because Recharts mounts it into the same root with full context.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useT();
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-2xl text-left">
      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{data.feature}</p>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
        {t('ml.meanDecreaseAuc')}{' '}
        <span className="text-blue-700 font-bold font-mono">
          {data.mean.toFixed(4)}
        </span>
      </p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        {t('ml.stdDev')} <span className="font-mono">{data.std.toFixed(4)}</span>
      </p>
    </div>
  );
};

export default function MlModelsTabs({ data }: { data: any }) {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<'risk' | 'fraud' | 'recommendations'>('risk');

  const tabs = [
    { id: 'risk', label: t('ml.tabRisk'), icon: Brain },
    { id: 'fraud', label: t('ml.tabFraud'), icon: Target },
    { id: 'recommendations', label: t('ml.tabRecommendations'), icon: Sparkles },
  ] as const;

  const renderRiskOrFraudTab = (type: 'risk' | 'fraud') => {
    const metrics = data[type];
    // Plots are proxied through the Next.js API route /api/ml-plots/[filename]
    // which authenticates via the access_token cookie and streams the PNG
    // from the backend (which in turn fetches it from the ml-service on
    // Railway's internal network). This keeps the ml-service private.
    const plotsBaseUrl = '/api/ml-plots';

    if (!metrics) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-md">
          <AlertCircle className="mx-auto h-8 w-8 text-blue-500 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">{t('ml.metricsOffline')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('ml.noTelemetry').replace('{type}', type)}</p>
        </div>
      );
    }

    const { methodology, best_model, best_params, cv_summary, test_metrics, best_confusion_matrix, permutation_importance } = metrics;

    // Confusion Matrix values
    const [[tn, fp], [fn, tp]] = best_confusion_matrix || [[0, 0], [0, 0]];
    const total = tn + fp + fn + tp;
    const accuracy = total > 0 ? (tn + tp) / total : 0;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return (
      <div className="space-y-6">
        {/* Top Cards: Methodology & Hyperparameters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Methodology */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('ml.methodology')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('ml.bestArchitecture')}</span>
                  <p className="text-slate-900 dark:text-slate-100 font-medium text-sm mt-0.5">{best_model || metrics.best_pipeline || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('ml.cvStrategy')}</span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5 font-mono">{methodology?.cv_strategy || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('ml.hyperparameterSearch')}</span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">{methodology?.hyperparameter_search || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('ml.selectionCriterion')}</span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">{methodology?.best_model_selection_criterion || methodology?.best_pipeline_selection_criterion || 'N/A'}</p>
                </div>
              </div>
            </div>
            {methodology?.ablation_design && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('ml.ablationStudy')}</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic leading-relaxed">"{methodology.ablation_design}"</p>
              </div>
            )}
          </div>

          {/* Hyperparameters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('ml.optimalHyperparams')}</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{t('ml.optimalHyperparamsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                {best_params && Object.entries(best_params).length > 0 ? (
                  Object.entries(best_params).map(([key, val]: any) => (
                    <div 
                      key={key} 
                      className="bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 flex flex-col items-start min-w-[100px]"
                    >
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono tracking-tight font-bold">{key}</span>
                      <span className="text-xs text-blue-700 font-mono font-bold mt-0.5">
                        {typeof val === 'boolean' ? (val ? 'True' : 'False') : String(val)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">{t('ml.noHyperparams')}</p>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>N_Train: {metrics.n_train || 'N/A'}</span>
              <span>N_Test: {metrics.n_test || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Middle row: CV comparison table & Feature importance */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* CV Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md lg:col-span-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('ml.classifierComparison')}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3 pr-2">{t('ml.colPipeline')}</th>
                      <th className="pb-3 px-2 text-right">{t('ml.colCvMeanAuc')}</th>
                      <th className="pb-3 px-2 text-right">{t('ml.colCvStd')}</th>
                      <th className="pb-3 px-2 text-right">{t('ml.colTestAuc')}</th>
                      <th className="pb-3 pl-2 text-right">{t('ml.colTestF1')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {cv_summary && Object.entries(cv_summary).map(([name, summary]: any) => {
                      const test = test_metrics?.[name] || {};
                      const isBest = name === best_model || name === metrics.best_pipeline;
                      return (
                        <tr 
                          key={name} 
                          className={`hover:bg-slate-100 dark:hover:bg-slate-800/20 transition-colors ${isBest ? 'bg-blue-700/5 font-semibold text-white' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          <td className="py-3 pr-2 flex items-center gap-2 max-w-[200px] truncate">
                            {isBest && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />}
                            <span className="truncate">{name}</span>
                          </td>
                          <td className="py-3 px-2 text-right font-mono">
                            {(summary.cv_mean_roc_auc ?? summary.mean_roc_auc ?? 0).toFixed(4)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-500 dark:text-slate-400">
                            {(summary.cv_std_roc_auc ?? summary.std_roc_auc ?? 0).toFixed(4)}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-blue-700">
                            {(test.roc_auc ?? 0).toFixed(4)}
                          </td>
                          <td className="py-3 pl-2 text-right font-mono text-emerald-700 dark:text-emerald-400">
                            {(test.f1 ?? 0).toFixed(4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded bg-blue-700/10 border border-blue-700/30"></div>
                <span>{t('ml.bestCvPipeline')}</span>
              </div>
            </div>
          </div>

          {/* Permutation Importance Recharts Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('ml.permutationImportance')}</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                {t('ml.permutationDesc')}
              </p>
            </div>
            {permutation_importance && permutation_importance.length > 0 ? (
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...permutation_importance].reverse().map((item: any) => ({
                      feature: item.feature.replace('_', ' '),
                      mean: item.mean_decrease_auc,
                      std: item.std_decrease_auc,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid stroke="#1f1f22" strokeDasharray="3 3" horizontal={false} vertical={true} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 9, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      tick={{ fontSize: 9, fill: '#d4d4d8' }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip content={<CustomPermutationTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                    <ReferenceLine x={0} stroke="#3f3f46" strokeWidth={1} />
                    <Bar dataKey="mean" radius={3} barSize={10} fill="#60a5fa" fillOpacity={0.85}>
                      <ErrorBar dataKey="std" width={4} strokeWidth={1.5} stroke="#fb7185" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <AlertCircle className="h-6 w-6 text-blue-500/70 mb-3" />
                <p className="text-sm text-slate-700 dark:text-slate-300 text-center font-medium">{t('ml.notApplicableTextModels')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center max-w-md leading-relaxed">
                  {t('ml.fraudUsesTfidf')} <span className="text-blue-700 font-mono">TF-IDF</span> {t('ml.fraudUsesTfidfRest')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center max-w-md leading-relaxed">
                  {t('ml.insteadShap')} <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{t('ml.insteadShapBold')}</span> {t('ml.insteadShapRest')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Confusion Matrix and Plot Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Confusion Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Grid className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('ml.confusionMatrix')}</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                {t('ml.confusionDesc')}
              </p>
              <div className="grid grid-cols-2 gap-3 aspect-square max-w-[240px] mx-auto w-full">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">{t('ml.trueNegative')}</span>
                  <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">{tn}</span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 mt-0.5">{t('ml.predictedSafe')}<br/>{t('ml.actualSafe')}</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">{t('ml.falsePositive')}</span>
                  <span className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">{fp}</span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 mt-0.5">{t('ml.predictedRisk')}<br/>{t('ml.actualSafe')}</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">{t('ml.falseNegative')}</span>
                  <span className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">{fn}</span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 mt-0.5">{t('ml.predictedSafe')}<br/>{t('ml.actualRisk')}</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">{t('ml.truePositive')}</span>
                  <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">{tp}</span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 mt-0.5">{t('ml.predictedRisk')}<br/>{t('ml.actualRisk')}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/60 text-xs font-mono">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">{t('ml.accuracyLabel')}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{(accuracy * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">{t('ml.precisionLabel')}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{(precision * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">{t('ml.recallLabel')}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{(recall * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">{t('ml.f1Label')}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{(f1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Plot Gallery */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md lg:col-span-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileImage className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('ml.metricsGallery')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GalleryImage 
                  src={`${plotsBaseUrl}/${type}_cv_distribution.png`}
                  alt={`${type}_cv_distribution.png`}
                  caption={t('ml.cvAucDist')}
                />
                <GalleryImage 
                  src={`${plotsBaseUrl}/${type}_roc_curves.png`}
                  alt={`${type}_roc_curves.png`}
                  caption={t('ml.rocCurves')}
                />
                <GalleryImage 
                  src={`${plotsBaseUrl}/${type}_confusion_matrix.png`}
                  alt={`${type}_confusion_matrix.png`}
                  caption={t('ml.confusionMatrixGrid')}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <InfoIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span>{t('ml.plotsLoadHint')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendationsTab = () => {
    const recs = data.recommendations;

    if (!recs) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-md">
          <AlertCircle className="mx-auto h-8 w-8 text-blue-500 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">Metrics Offline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('ml.noRecsDetails')}</p>
        </div>
      );
    }

    const accuracy = recs.demographic_profile_match_accuracy ?? 0;

    return (
      <div className="space-y-6">
        {/* Info row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Methodology */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-blue-700" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('ml.recsMethodology')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('ml.filteringParadigm')}</span>
                  <p className="text-slate-900 dark:text-slate-100 font-medium text-sm mt-0.5">{recs.approach || 'Content-Based Filtering'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('ml.catalogSize')}</span>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mt-0.5 font-bold font-mono text-blue-700">
                    {recs.n_products_in_catalog || 'N/A'} {t('ml.catalogSuffix')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('ml.vocabSize')}</span>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mt-0.5 font-mono">{recs.tfidf_vocabulary_size || '200'} {t('ml.vocabSuffix')}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{t('ml.tfidfNgram')}</span>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mt-0.5 font-mono">
                    {recs.tfidf_ngram_range ? `(${recs.tfidf_ngram_range.join(', ')})` : '(1, 2)'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>{t('ml.catalogNote')}</span>
            </div>
          </div>

          {/* Demographic Accuracy Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('ml.demoAccuracy')}</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                {t('ml.demoAccuracyDesc')}
              </p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-bold font-mono text-emerald-700 dark:text-emerald-400">{(accuracy * 100).toFixed(0)}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">{t('ml.matchSuffix')}</span>
              </div>
              <div className="w-full bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${accuracy * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-4">
              {t('ml.testedOnCohorts')}
            </span>
          </div>
        </div>

        {/* Per profile breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-700" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('ml.cohortPredictions')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pr-2">{t('ml.colProfileGroup')}</th>
                  <th className="pb-3 px-2">{t('ml.colInterestKeywords')}</th>
                  <th className="pb-3 px-2">{t('ml.colTopMatch')}</th>
                  <th className="pb-3 px-2 text-right">{t('ml.colSimilarity')}</th>
                  <th className="pb-3 px-2 text-center">{t('ml.colExpectedType')}</th>
                  <th className="pb-3 pl-2 text-center">{t('ml.colMatch')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recs.profile_results && Object.entries(recs.profile_results).map(([profileKey, summary]: any) => {
                  const topProduct = summary.top_3?.[0] || {};
                  const matched = summary.matched_expectation;
                  return (
                    <tr key={profileKey} className="hover:bg-slate-100 dark:hover:bg-slate-800/10 transition-colors text-slate-700 dark:text-slate-300">
                      <td className="py-3 pr-2 font-semibold text-slate-900 dark:text-slate-100 capitalize">
                        {profileKey.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-400 italic max-w-[200px] truncate" title={summary.query}>
                        "{summary.query}"
                      </td>
                      <td className="py-3 px-2 text-slate-800 dark:text-slate-200">
                        {topProduct.name || 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-blue-700">
                        {topProduct.similarity ? (topProduct.similarity * 100).toFixed(0) : '0'}%
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-[10px] uppercase font-bold bg-zinc-850 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                          {summary.expected_top_type}
                        </span>
                      </td>
                      <td className="py-3 pl-2 text-center">
                        {matched ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            {t('ml.pillMatch')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-700/10 text-blue-700 border border-blue-700/20">
                            {t('ml.pillMisaligned')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs toggle */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? 'border-blue-700 text-blue-700' 
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs views content */}
      <div className="transition-all duration-300">
        {activeTab === 'risk' && renderRiskOrFraudTab('risk')}
        {activeTab === 'fraud' && renderRiskOrFraudTab('fraud')}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
      </div>
    </div>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
