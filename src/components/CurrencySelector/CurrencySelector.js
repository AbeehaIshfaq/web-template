// Corrected CurrencySelector.js - Integrated with React Final Form

import React, { useEffect } from 'react';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { FieldSelect } from '../../components';
import { useCurrency } from '../../context/CurrencyContext';
import css from './CurrencySelector.module.css';

const CurrencySelector = ({ className, formId, formApi }) => {
  const intl = useIntl();
  const { 
    getCurrencyInfo, 
    setManualCurrency, 
    clearManualCurrency 
  } = useCurrency();
  
  const currencyInfo = getCurrencyInfo();
  
  // Determine current selection value for the dropdown
  const getCurrentValue = () => {
    if (currencyInfo.isManualSelection) {
      return currencyInfo.selectedCurrency;
    }
    return 'auto'; // Auto-detected
  };

  // Watch for changes in the form field and update currency context
  useEffect(() => {
    if (formApi) {
      // Subscribe to currency field changes
      const unsubscribe = formApi.subscribe(
        (formState) => {
          const currencyValue = formState.values?.currencySelector;
          if (currencyValue) {
            handleCurrencyValueChange(currencyValue);
          }
        },
        { values: true }
      );

      // Set initial value
      const initialValue = getCurrentValue();
      formApi.change('currencySelector', initialValue);

      return unsubscribe;
    }
  }, [formApi]);

  const handleCurrencyValueChange = (value) => {
    console.log('💱 Currency selector value changed to:', value);
    
    if (value === 'auto') {
      clearManualCurrency();
    } else if (value === 'USD' || value === 'CAD') {
      setManualCurrency(value);
    }
  };

  return (
    <div className={className}>
      <FieldSelect
        id={`${formId}.currencySelector`}
        name="currencySelector"
        label={intl.formatMessage({ id: 'CurrencySelector.label' })}
        // Remove custom onChange handler, let React Final Form handle it
      >
        <option value="auto">
          {intl.formatMessage(
            { id: 'CurrencySelector.autoOption' },
            { currency: currencyInfo.autoDetectedCurrency }
          )}
        </option>
        <option value="USD">
          {intl.formatMessage({ id: 'CurrencySelector.usdOption' })}
        </option>
        <option value="CAD">
          {intl.formatMessage({ id: 'CurrencySelector.cadOption' })}
        </option>
      </FieldSelect>
    </div>
  );
};

export default CurrencySelector;