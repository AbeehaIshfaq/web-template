// src/components/StockTypeFilter/StockTypeFilter.js
import React from 'react';
import { SelectSingleFilter } from '../../components';
import { injectIntl, intlShape } from '../../util/reactIntl';

const StockTypeFilter = (props) => {
  const { intl, urlParam, initialValues, onSelect, ...rest } = props;

  const options = [
    { key: 'solo', label: intl.formatMessage({ id: 'StockTypeFilter.solo' }) },
    { key: 'group', label: intl.formatMessage({ id: 'StockTypeFilter.group' }) },
  ];

  const handleChange = (selected) => {
    onSelect(selected);
  };

  return (
    <SelectSingleFilter
      id="stockType"
      name="stockType"
      label={intl.formatMessage({ id: 'StockTypeFilter.label' })}
      options={options}
      onSubmit={handleChange}
      initialValues={initialValues}
      {...rest}
    />
  );
};

StockTypeFilter.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(StockTypeFilter);