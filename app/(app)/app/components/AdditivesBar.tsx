import Image from 'next/image'
import { AdditiveProps } from '@/types'
import { getAdditivesDetails, getBarUIDetails, getMetric, getRateIndex } from '@/utils'
import { Back } from '@/(app)/components';
import { ProductNutrients } from '@prisma/client';
import { Suspense, useState } from 'react';
import AdditivesDetail from './AdditivesDetail';
import { AdditivesSkeleton } from './skeleton';

export default function AdditivesBar({nutrient}: {nutrient: ProductNutrients}) {

  const [status, setStatus] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const { amount } = nutrient;
  const additives = nutrient.unitName!=='' ? nutrient.unitName.split(' ') : [];

  const metric = getMetric( nutrient.nameKey );
  if ( !metric ) return;

  const ratedIndex = getRateIndex( nutrient.amount, metric );

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
    setStatus(!status);
    setShowDetail(false);
  }

  const handleShowDetail = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowDetail(!showDetail);
  }

  let additiveCount = additives.length;

  //! TODO: This should be on AdditivesDetail component
  const additivesDetail: AdditiveProps[] = getAdditivesDetails(additives);

  return (
    <div 
      onClick={handleClick} 
      className="px-5 py-4 cursor-pointer hover:bg-background-2 transition-colors border-b border-background-3 last:border-b-0"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className='w-10 h-10 flex items-center justify-center rounded-lg' style={{ backgroundColor: "var(--background-2)" }}>
          <Image
            src='/additives.png' 
            alt='Additives'
            className='w-6 h-6'
            width="24" 
            height="24" 
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className='flex-1 min-w-0'>
              <h4 className="font-semibold text-sm mb-0.5">
                {additiveCount ? 'Additives' : 'No additives'}
              </h4>
              <p className="text-xs text-text-2">{ui.message}</p>
            </div>
            
            {/* Count and Rating Badge */}
            <div className='flex items-center gap-3 flex-shrink-0'>
              <div className="text-right">
                <div className="font-bold text-sm">
                  {additiveCount ? additiveCount : '✔'}
                </div>
                {additiveCount > 0 && (
                  <div className="text-xs text-text-2">found</div>
                )}
              </div>
              <div 
                style={{ backgroundColor: ui.color }} 
                className='rounded-full w-6 h-6 shadow-sm'
              ></div>
              <Back className='barIcon -rotate-90 text-text-2 transition-transform' />
            </div>
          </div>

          {/* Expandable Details */}
          <div className='barChart h-0 overflow-hidden transition-all duration-300 ease-in-out'>
            <div className="pt-4 space-y-3">
              {/* Additives List */}
              {additivesDetail.map((info, index) => (
                <div 
                  key={index} 
                  className='flex items-center gap-3 p-3 rounded-lg'
                  style={{ backgroundColor: "var(--background-2)" }}
                >
                  <div 
                    style={{ backgroundColor: info.color }} 
                    className='rounded-full w-5 h-5 flex-shrink-0 shadow-sm'
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{info.number}</div>
                    <div className="text-xs text-text-2">{info.riskTitle}</div>
                  </div>
                </div>
              ))}
              
              {/* Show More Button */}
              {additivesDetail.length > 0 && (
                <div className="pt-2">
                  <button 
                    onClick={handleShowDetail} 
                    className='text-primary hover:underline text-sm font-medium transition-colors'
                  >
                    {!showDetail ? '📋 Show detailed information' : '✕ Hide details'}
                  </button>
                  
                  {showDetail && (
                    <div className="mt-3">
                      <Suspense fallback={<AdditivesSkeleton />}>
                        <AdditivesDetail additives={additives} />
                      </Suspense>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
