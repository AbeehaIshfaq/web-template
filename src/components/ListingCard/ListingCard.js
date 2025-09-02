import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useCurrency } from '../../context/CurrencyContext'; // ADD THIS IMPORT

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  displayPrice,
  isPriceVariationsEnabled,
  requireListingImage,
} from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { formatMoney } from '../../util/currency';
import { convertPriceForUser } from '../../util/currencyConversion'; // ADD THIS IMPORT
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import {
  AspectRatioWrapper,
  NamedLink,
  ResponsiveImage,
  ListingCardThumbnail,
} from '../../components';

import css from './ListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

// MODIFIED: Enhanced priceData function with currency conversion and debugging
const priceData = async (price, currency, intl, isCanadian) => {
  console.log('💰 ListingCard priceData called:', { 
    price, 
    currency, 
    isCanadian,
    priceExists: !!price,
    priceCurrency: price?.currency,
    priceAmount: price?.amount 
  });
  
  if (!price) {
    console.log('💰 No price provided to priceData');
    return {};
  }

  // Convert price for Canadian users
  console.log('🔄 Calling convertPriceForUser from ListingCard...');
  const displayPrice = await convertPriceForUser(price, isCanadian);
  console.log('✅ Received converted price:', { 
    originalPrice: price,
    displayPrice,
    conversionHappened: displayPrice !== price 
  });
  
  if (displayPrice && displayPrice.currency === currency) {
    const formattedPrice = formatMoney(intl, displayPrice);
    console.log('💰 Price formatted successfully:', { 
      displayPrice, 
      formattedPrice 
    });
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (displayPrice) {
    console.log('⚠️ Currency mismatch - using unsupported price format:', { 
      displayPriceCurrency: displayPrice.currency, 
      expectedCurrency: currency 
    });
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: displayPrice.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: displayPrice.currency }
      ),
    };
  }
  
  console.log('💰 No displayPrice available - returning empty object');
  return {};
};

const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

// MODIFIED: Enhanced PriceMaybe component with async price conversion
const PriceMaybe = props => {
  const { price, publicData, config, intl, listingTypeConfig, isCanadian } = props;
  const [priceState, setPriceState] = useState({ formattedPrice: '', priceTitle: '' });
  const [isLoading, setIsLoading] = useState(true);

  const showPrice = displayPrice(listingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  // Convert price asynchronously
  useEffect(() => {
    console.log('🔄 PriceMaybe useEffect triggered:', { 
      price, 
      isCanadian, 
      showPrice,
      currencyConfig: config.currency 
    });
    
    const convertPrice = async () => {
      setIsLoading(true);
      console.log('⏳ Starting price conversion in PriceMaybe...');
      
      try {
        const convertedPriceData = await priceData(price, config.currency, intl, isCanadian);
        console.log('✅ Price conversion completed in PriceMaybe:', convertedPriceData);
        setPriceState(convertedPriceData);
      } catch (error) {
        console.error('💥 Error converting price in PriceMaybe:', error);
        // Fallback to original price
        const fallbackData = price ? {
          formattedPrice: formatMoney(intl, price),
          priceTitle: formatMoney(intl, price)
        } : {};
        console.log('🔄 Using fallback price data:', fallbackData);
        setPriceState(fallbackData);
      } finally {
        console.log('🏁 Price conversion process finished');
        setIsLoading(false);
      }
    };

    convertPrice();
  }, [price, config.currency, intl, isCanadian]);

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;
  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);

  const { formattedPrice, priceTitle } = priceState;

  // Show loading state briefly
  if (isLoading && !formattedPrice) {
    return (
      <div className={css.price} title="Loading price...">
        <span className={css.priceValue}>...</span>
      </div>
    );
  }

  const priceValue = <span className={css.priceValue}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? (
    <span className={css.perUnit}>
      <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
    </span>
  ) : (
    ''
  );

  return (
    <div className={css.price} title={priceTitle}>
      {hasMultiplePriceVariants ? (
        <FormattedMessage
          id="ListingCard.priceStartingFrom"
          values={{ priceValue, pricePerUnit }}
        />
      ) : (
        <FormattedMessage id="ListingCard.price" values={{ priceValue, pricePerUnit }} />
      )}
    </div>
  );
};

/**
 * ListingCardImage
 * Component responsible for rendering the image part of the listing card.
 * It either renders the first image from the listing's images array with lazy loading,
 * or a stylized placeholder if images are disabled for the listing type.
 * Also wraps the image in a fixed aspect ratio container for consistent layout.
 * @component
 * @param {Object} props
 * @param {Object} props.currentListing listing entity with image data
 * @param {Function?} props.setActivePropsMaybe mouse enter/leave handlers for map highlighting
 * @param {string} props.title listing title for alt text
 * @param {string} props.renderSizes img/srcset size rules
 * @param {number} props.aspectWidth aspect ratio width
 * @param {number} props.aspectHeight aspect ratio height
 * @param {string} props.variantPrefix image variant prefix (e.g. "listing-card")
 * @param {boolean} props.showListingImage whether to show actual listing image or not
 * @param {Object?} props.style the background color for the listing card with no image
 * @returns {JSX.Element} listing image with fixed aspect ratio or fallback preview
 */
const ListingCardImage = props => {
  const {
    currentListing,
    setActivePropsMaybe,
    title,
    renderSizes,
    aspectWidth,
    aspectHeight,
    variantPrefix,
    showListingImage,
    style,
  } = props;

  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  // Render the listing image only if listing images are enabled in the listing type
  return showListingImage ? (
    <AspectRatioWrapper
      className={css.aspectRatioWrapper}
      width={aspectWidth}
      height={aspectHeight}
      {...setActivePropsMaybe}
    >
      <LazyImage
        rootClassName={css.rootForImage}
        alt={title}
        image={firstImage}
        variants={variants}
        sizes={renderSizes}
      />
    </AspectRatioWrapper>
  ) : (
    <ListingCardThumbnail
      style={style}
      listingTitle={title}
      className={css.aspectRatioWrapper}
      width={aspectWidth}
      height={aspectHeight}
      setActivePropsMaybe={setActivePropsMaybe}
    />
  );
};

/**
 * ListingCard
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.listing API entity: listing or ownListing
 * @param {string?} props.renderSizes for img/srcset
 * @param {Function?} props.setActiveListing
 * @param {boolean?} props.showAuthorInfo
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
export const ListingCard = props => {
  const config = useConfiguration();
  const intl = props.intl || useIntl();
  const { isCanadian } = useCurrency(); // ADD THIS: Get user's currency context

  const {
    className,
    rootClassName,
    listing,
    renderSizes,
    setActiveListing,
    showAuthorInfo = true,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', price, publicData } = currentListing.attributes;
  const slug = createSlug(title);

  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;

  const { listingType, cardStyle } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showListingImage = requireListingImage(foundListingTypeConfig);

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;

  // Sets the listing as active in the search map when hovered (if the search map is enabled)
  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  return (
    <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
      <ListingCardImage
        renderSizes={renderSizes}
        title={title}
        currentListing={currentListing}
        config={config}
        setActivePropsMaybe={setActivePropsMaybe}
        aspectWidth={aspectWidth}
        aspectHeight={aspectHeight}
        variantPrefix={variantPrefix}
        style={cardStyle}
        showListingImage={showListingImage}
      />
      <div className={css.info}>
        <PriceMaybe
          price={price}
          publicData={publicData}
          config={config}
          intl={intl}
          listingTypeConfig={foundListingTypeConfig}
          isCanadian={isCanadian} // PASS: Canadian flag to PriceMaybe
        />
        <div className={css.mainInfo}>
          {showListingImage && (
            <div className={css.title}>
              {richText(title, {
                longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
                longWordClass: css.longWord,
              })}
            </div>
          )}
          {showAuthorInfo ? (
            <div className={css.authorInfo}>
              <FormattedMessage id="ListingCard.author" values={{ authorName }} />
            </div>
          ) : null}
        </div>
      </div>
    </NamedLink>
  );
};

export default ListingCard;