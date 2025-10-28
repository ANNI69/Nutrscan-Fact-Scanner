import Image from 'next/image'
import { ProteinIcon, SugarIcon, SodiumIcon, FatIcon, FiberIcon, CalorieIcon } from './NutrientIcons'
import { rateIndexColors } from '@/constants'
import { limitDecimalPlaces, getBarUIDetails, getRateByIndex, getMetric } from '@/utils'
import { ProductNutrients } from '@prisma/client';
import { Back } from '@/(app)/components';

export default function NutrientBar({nutrient}: {nutrient: ProductNutrients}) {

  const { amount } = nutrient;

  const metric = getMetric( nutrient.nameKey );
  if ( !metric ) return;
  
  //! TODO: This may be wrong, check it
  const ratedIndex = getRateByIndex( nutrient.rated, metric );

  // Get UI details
  const ui = getBarUIDetails( amount, ratedIndex, metric);

  // handle nutrient bar expand/collapse
  const handleClick = (e: React.MouseEvent<HTMLDivElement>
    ) => {
    let bar = e.currentTarget;
    let barIcon = bar.querySelectorAll('.barIcon')[0];
    let barChart = bar.querySelectorAll('.barChart')[0];
    barIcon.classList.toggle('-rotate-90');
    barIcon.classList.toggle('rotate-90');
    barChart.classList.toggle('h-0');
    barChart.classList.toggle('h-auto');
  }

  // Format amount more readable (0.432 => 0.43, 543.2 => 543, 1.324 => 1.3)
  // Amounts under 1 limited to 2 decimals, amounts bigger than 10 with no decimals, other than these just 1 decimal
  let amountFormatted = limitDecimalPlaces(amount, 1);
  if ( amount < 1 ) amountFormatted = limitDecimalPlaces(amount, 2);
  if ( amount >= 10 ) amountFormatted = limitDecimalPlaces(amount, 0);

  return (
    <div 
      onClick={handleClick} 
      className="px-5 py-4 cursor-pointer hover:bg-background-2 transition-colors border-b border-background-3 last:border-b-0"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className='w-10 h-10 flex items-center justify-center rounded-lg' style={{ backgroundColor: "var(--background-2)" }}>
          <div className="w-6 h-6">
            {metric.name === 'Protein' && <ProteinIcon />}
            {metric.name === 'Sugar' && <SugarIcon />}
            {(metric.name === 'Sodium' || metric.name === 'Salt') && <SodiumIcon />}
            {metric.name === 'Saturated fat' && <FatIcon />}
            {metric.name === 'Fiber' && <FiberIcon />}
            {metric.name === 'Calories' && <CalorieIcon />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className='flex-1 min-w-0'>
              <h4 className="font-semibold text-sm mb-0.5">{metric.name}</h4>
              <p className="text-xs text-text-2">{ui.message}</p>
            </div>
            
            {/* Amount and Rating Badge */}
            <div className='flex items-center gap-3 flex-shrink-0'>
              <div className="text-right">
                <div className="font-bold text-sm">{amountFormatted}</div>
                <div className="text-xs text-text-2">{metric.benchmarks_unit}</div>
              </div>
              <div 
                style={{ backgroundColor: ui.color }} 
                className='rounded-full w-6 h-6 shadow-sm'
              ></div>
              <Back className='barIcon -rotate-90 text-text-2 transition-transform' />
            </div>
          </div>

          {/* Expandable Chart */}
          <div className='barChart h-0 overflow-hidden transition-all duration-300 ease-in-out'>
            <div className="pt-4 space-y-2">
              {/* Arrow Indicator */}
              <div className='relative h-5'>
                <div 
                  style={{
                    left: ui.arrowLeft,
                    color: ui.color
                  }} 
                  className='text-sm absolute -ml-2 animate-bounce font-bold'
                >
                  ▼
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className='flex gap-1 h-2 rounded-full overflow-hidden'>
                {metric.rates.map((rate, index) => (
                  <div 
                    key={index} 
                    style={{
                      width: ui.barPartsWidth[index],
                      backgroundColor: rateIndexColors[rate]
                    }} 
                    className='h-full first:rounded-l-full last:rounded-r-full'
                  ></div>
                ))}
              </div>
              
              {/* Benchmark Labels */}
              <div className='flex justify-between text-xs text-text-2 font-medium pt-1'>
                <div>0</div>
                {metric.benchmarks_100g.map((benchmark, index) => (
                  <div 
                    key={index} 
                    style={{
                      width: ui.barPartsWidth[index]
                    }} 
                    className='text-right'
                  >
                    {ui.moreThanLargestBenchmark && index===metric.benchmarks_100g.length-1 && `+`}{benchmark}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
