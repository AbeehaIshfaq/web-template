import React from 'react';
import { bool, func, number, object, string } from 'prop-types';
import { injectIntl, intlShape } from '../../../util/reactIntl';
import SelectSingleFilter from '../SelectSingleFilter/SelectSingleFilter';

const AvailabilityFilterComponent = props => {
    console.log('AvailabilityFilter props:', props);
  const {
    rootClassName,
    className,
    id,
    label,
    urlQueryParams,
    onSubmit,
    showAsPopup,
    contentPlacementOffset,
    intl,
    ...rest
  } = props;

  // Custom options that map to stock-based queries
  const options = [
    { 
      key: 'solo', 
      label: 'Solo (1 item)',
      // This will filter for listings with exactly 1 item in stock
      queryValue: '1'
    },
    { 
      key: 'groups', 
      label: 'Groups (2+ items)',
      // This will be handled by custom logic to filter stock > 1
      queryValue: 'groups'
    },
  ];

    console.log('AvailabilityFilter options:', options);

  // Custom submit handler to convert our filter to stock queries
  const handleSubmit = (values) => {
    const { availabilityType } = values;
    
    if (availabilityType === 'solo') {
      // Filter for exactly 1 item in stock
      onSubmit({ meta_currentStock: '1' });
    } else if (availabilityType === 'groups') {
      // Filter for more than 1 item in stock
      onSubmit({ meta_currentStockGt: '1' });
    } else {
      // Clear filter
      onSubmit({ meta_currentStock: null, meta_currentStockGt: null });
    }
  };

  return (
    <SelectSingleFilter
      {...rest}
      rootClassName={rootClassName}
      className={className}
      id={id}
      name="availabilityType"
      queryParamNames={['meta_currentStock', 'meta_currentStockGt']}
      label={label || 'Availability'}
      options={options}
      onSubmit={onSubmit}
      showAsPopup={showAsPopup}
      contentPlacementOffset={contentPlacementOffset}
    />
  );
};

AvailabilityFilterComponent.defaultProps = {
  rootClassName: null,
  className: null,
  showAsPopup: false,
  contentPlacementOffset: 0,
  label: 'Availability',
};

AvailabilityFilterComponent.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  label: string,
  urlQueryParams: object,
  onSubmit: func.isRequired,
  showAsPopup: bool,
  contentPlacementOffset: number,
  intl: intlShape.isRequired,
};

const AvailabilityFilter = injectIntl(AvailabilityFilterComponent);

export default AvailabilityFilter;