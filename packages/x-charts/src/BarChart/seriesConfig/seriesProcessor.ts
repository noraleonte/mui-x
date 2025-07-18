import { stack as d3Stack } from '@mui/x-charts-vendor/d3-shape';
import { warnOnce } from '@mui/x-internals/warning';
import type { DefaultizedBarSeriesType } from '../../models';
import { getStackingGroups } from '../../internals/stackSeries';
import { DatasetElementType, DatasetType } from '../../models/seriesType/config';
import { SeriesId } from '../../models/seriesType/common';
import { SeriesProcessor } from '../../internals/plugins/models';

type BarDataset = DatasetType<number | null>;

const barValueFormatter = ((v) =>
  v == null ? '' : v.toLocaleString()) as DefaultizedBarSeriesType['valueFormatter'];

const seriesProcessor: SeriesProcessor<'bar'> = (params, dataset) => {
  const { seriesOrder, series } = params;
  const stackingGroups = getStackingGroups(params);

  // Create a data set with format adapted to d3
  const d3Dataset: BarDataset = (dataset as BarDataset) ?? [];
  seriesOrder.forEach((id) => {
    const data = series[id].data;
    if (data !== undefined) {
      data.forEach((value, index) => {
        if (d3Dataset.length <= index) {
          d3Dataset.push({ [id]: value });
        } else {
          d3Dataset[index][id] = value;
        }
      });
    } else if (dataset === undefined) {
      throw new Error(
        [
          `MUI X Charts: bar series with id='${id}' has no data.`,
          'Either provide a data property to the series or use the dataset prop.',
        ].join('\n'),
      );
    }
  });

  const completedSeries: {
    [id: string]: DefaultizedBarSeriesType & {
      stackedData: [number, number][];
    };
  } = {};

  stackingGroups.forEach((stackingGroup) => {
    const { ids, stackingOffset, stackingOrder } = stackingGroup;
    // Get stacked values, and derive the domain
    const stackedSeries = d3Stack<any, DatasetElementType<number | null>, SeriesId>()
      .keys(
        ids.map((id) => {
          // Use dataKey if needed and available
          const dataKey = series[id].dataKey;
          return series[id].data === undefined && dataKey !== undefined ? dataKey : id;
        }),
      )
      .value((d, key) => d[key] ?? 0) // defaultize null value to 0
      .order(stackingOrder)
      .offset(stackingOffset)(d3Dataset);

    ids.forEach((id, index) => {
      const dataKey = series[id].dataKey;
      completedSeries[id] = {
        layout: 'vertical',
        labelMarkType: 'square',
        minBarSize: 0,
        valueFormatter: series[id].valueFormatter ?? barValueFormatter,
        ...series[id],
        data: dataKey
          ? dataset!.map((data) => {
              const value = data[dataKey];
              if (typeof value !== 'number') {
                if (process.env.NODE_ENV !== 'production') {
                  if (value !== null) {
                    warnOnce([
                      `MUI X Charts: your dataset key "${dataKey}" is used for plotting bars, but contains nonnumerical elements.`,
                      'Bar plots only support numbers and null values.',
                    ]);
                  }
                }
                return null;
              }
              return value;
            })
          : series[id].data!,
        stackedData: stackedSeries[index].map(([a, b]) => [a, b]),
      };
    });
  });

  return {
    seriesOrder,
    stackingGroups,
    series: completedSeries,
  };
};

export default seriesProcessor;
