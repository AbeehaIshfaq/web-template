import React from 'react';
import { useIntl } from 'react-intl';
import { FieldSelect } from '../../../components';
import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';
import css from './StockTypeFilter.module.css';

const StockTypeFilter = props => {
  const {
    id,
    name,
    label,
    initialValues,
    onSubmit,
    showAsPopup = false,
    ...rest
  } = props;
  
  const intl = useIntl();
  
  // Map current minStock/maxStock to UI value
  const currentMinStock = initialValues?.minStock;
  const currentMaxStock = initialValues?.maxStock;
  let selectedValue = '';
  
  if (currentMinStock === 1 && currentMaxStock === 1) {
    selectedValue = 'solo';
  } else if (currentMinStock >= 2 && !currentMaxStock) {
    selectedValue = 'group';
  }

  const handleSubmit = value => {
    if (value === 'solo') {
      onSubmit({ minStock: 1, maxStock: 1 });
    } else if (value === 'group') {
      onSubmit({ minStock: 2 });
    } else {
      onSubmit({});
    }
  };

  const filterOptions = [
    { key: '', label: intl.formatMessage({ id: 'StockTypeFilter.anyStock' }) },
    { key: 'solo', label: 'Solo' },
    { key: 'group', label: 'Group' }
  ];

  if (showAsPopup) {
    return (
      <FilterPopup
        id={`${id}.popup`}
        label={label}
        isSelected={!!selectedValue}
        onSubmit={handleSubmit}
        initialValues={{ stockType: selectedValue }}
        {...rest}
      >
        <FieldSelect
          name="stockType"
          options={filterOptions}
          className={css.select}
        />
      </FilterPopup>
    );
  }

  return (
    <FilterPlain
      id={`${id}.plain`}
      label={label}
      isSelected={!!selectedValue}
      onSubmit={handleSubmit}
      initialValues={{ stockType: selectedValue }}
      {...rest}
    >
      <FieldSelect
        name="stockType"
        options={filterOptions}
        className={css.select}
      />
    </FilterPlain>
  );
};

export default StockTypeFilter;