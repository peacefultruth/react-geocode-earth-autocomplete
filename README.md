# react-geocode-earth-autocomplete

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/react-geocode-earth-autocomplete.svg)](https://www.npmjs.com/package/react-geocode-earth-autocomplete) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

A React component to build a customized UI for geocode.earth Autocomplete

Enable you to easily build a customized autocomplete dropdown powered by [geocode.earth](https://geocode.earth/).

Full control over rendering to integrate well with other libraries (e.g. Redux-Form).

Basically the geocode.earth version of [hibiken/react-places-autocomplete](https://github.com/hibiken/react-places-autocomplete).



### Installation

```bash
yarn add react-geocode-earth-autocomplete
````

```bash
npm install --save react-geocode-earth-autocomplete
````



### Usage

Create your component, you'll need an api key from [geocode.earth](https://geocode.earth/).

```js
import React, { useState } from 'react';
import GeocodeEarthAutocomplete from 'react-geocode-earth-autocomplete';

export default (props) => {
    const [address, setAddress] = useState();

    return (
      <GeocodeEarthAutocomplete
        searchOptions={{
          api_key: "ge-..."
        }}
        value={address}
        onChange={(newAddress) => {
          setAddress(newAddress);
        }}
        onSelect={(newAddress) => {
          // do an api call
        }}
      >
        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => {
          <div>
            <input
              {...getInputProps({
                placeholder: 'Search Places ...',
                className: 'location-search-input',
              })}
            />
            <div className="autocomplete-dropdown-container">
              {loading && <div>Loading...</div>}
              {suggestions.map(suggestion => {
                const className = suggestion.active
                  ? 'suggestion-item--active'
                  : 'suggestion-item';
                // inline style for demonstration purpose
                const style = suggestion.active
                  ? { backgroundColor: '#fafafa', cursor: 'pointer' }
                  : { backgroundColor: '#ffffff', cursor: 'pointer' };
                return (
                  <div
                    {...getSuggestionItemProps(suggestion, {
                      className,
                      style,
                    })}
                  >
                    <span>{suggestion.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </GeocodeEarthAutocomplete>
    );
  }
}
```



## License

MIT © [peacefultruth](https://github.com/peacefultruth)
