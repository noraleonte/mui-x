import * as React from 'react';
import Box from '@mui/material/Box';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { LinePlot } from '@mui/x-charts/LineChart';
import { BarPlot } from '@mui/x-charts/BarChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';

export default function AxisWithComposition() {
  return (
    <Box sx={{ width: '100%', maxWidth: 600 }}>
      <ChartContainer
        xAxis={[
          {
            scaleType: 'band',
            data: ['Q1', 'Q2', 'Q3', 'Q4'],
            id: 'quarters',
            label: 'Quarters',
            height: 50,
          },
        ]}
        yAxis={[
          { id: 'money', position: 'right', width: 65 },
          { id: 'quantities', position: 'left', width: 65 },
        ]}
        series={[
          {
            type: 'line',
            id: 'revenue',
            yAxisId: 'money',
            data: [5645, 7542, 9135, 12221],
          },
          {
            type: 'bar',
            id: 'cookies',
            yAxisId: 'quantities',
            data: [3205, 2542, 3135, 8374],
          },
          {
            type: 'bar',
            id: 'icecream',
            yAxisId: 'quantities',
            data: [1645, 5542, 5146, 3735],
          },
        ]}
        height={400}
      >
        <BarPlot />
        <LinePlot />
        <ChartsXAxis
          axisId="quarters"
          label="2021 quarters"
          labelStyle={{ fontSize: 18 }}
        />
        <ChartsYAxis axisId="quantities" label="# units sold" />
        <ChartsYAxis axisId="money" label="revenue" />
      </ChartContainer>
    </Box>
  );
}
