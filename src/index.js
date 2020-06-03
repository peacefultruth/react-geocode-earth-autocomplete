import React, { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import debounce from "lodash.debounce";

const useThrottleFn = (fn, ms) => {
  const throttledFn = useMemo(() => {
    return debounce(fn, ms);
  }, [fn, ms]);

  // This is must because fn can call setState.
  useEffect(() => {
    return () => {
      throttledFn.cancel();
    };
  }, [throttledFn]);

  return throttledFn;
};

const fetchPredictions = ({
  value,
  searchOptions,
  setLoading,
  autocompleteCallback,
  onError,
  clearSuggestions
}) => {
  if (value && value.length) {
    setLoading(true);

    axios
      .get("https://api.geocode.earth/v1/autocomplete", {
        params: {
          ...searchOptions,
          ...{ text: value }
        }
      })
      .then(response => {
        setLoading(false);

        let data;
        if (response) {
          data = response.data;
        }

        autocompleteCallback(data);
      })
      .catch(error => {
        onError(500, clearSuggestions);
      });
  }
};

const Autocomplete = ({
  children,
  value,
  onChange,
  onSelect,
  onError,
  shouldFetchSuggestions,
  debounceValue,
  searchOptions,
  highlightFirstSuggestion
}) => {
  const [ready, setReady] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [userInputValue, setUserInputValue] = useState();
  const [mousedownOnSuggestion, setMousedownOnSuggestion] = useState(false);
  const [loading, setLoading] = useState(false);

  const autocompleteCallback = predictions => {
    let features;
    if (predictions) {
      features = predictions.features;
    }

    let newSuggestions = [];
    if (features) {
      features.forEach(({ properties }) => {
        const { label } = properties;
        const suggestion = {
          ...properties,
          description: label
        };
        newSuggestions = [...newSuggestions, ...[suggestion]];
      });
    }

    newSuggestions = newSuggestions.map((p, idx) => ({
      ...p,
      ...{
        active: highlightFirstSuggestion && idx === 0 ? true : false,
        index: idx
      }
    }));

    setSuggestions(newSuggestions);
  };

  const debouncedFetchPredictions = useThrottleFn(
    useCallback(props => {
      fetchPredictions(props);
    }, [])
  );

  const clearSuggestions = () => {
    setSuggestions([]);
  };
  const getActiveSuggestion = () => {
    return suggestions.find(suggestion => suggestion.active);
  };
  const getActiveSuggestionId = () => {
    const activeSuggestion = getActiveSuggestion();
    return activeSuggestion
      ? `PlacesAutocomplete__suggestion-${activeSuggestion.placeId}`
      : undefined;
  };
  const setActiveAtIndex = index => {
    const newSuggestions = suggestions.map((suggestion, idx) => {
      if (idx === index) {
        return { ...suggestion, active: true };
      } else {
        return { ...suggestion, active: false };
      }
    });
    setSuggestions(newSuggestions);
  };
  const clearActive = () => {
    const newSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      active: false
    }));
    setSuggestions(newSuggestions);
  };
  const selectActiveAtIndex = index => {
    const activeName = suggestions.find(
      suggestion => suggestion.index === index
    ).description;
    setActiveAtIndex(index);
    onChange(activeName);
  };

  const selectUserInputValue = () => {
    clearActive();
    onChange(userInputValue);
  };

  const handleSelect = (address, placeId, suggestion) => {
    clearSuggestions();
    if (onSelect) {
      onSelect(address, placeId, suggestion);
    } else {
      onChange(address);
    }
  };
  const handleEnterKey = () => {
    const activeSuggestion = getActiveSuggestion();
    if (activeSuggestion === undefined) {
      handleSelect(value, null, null);
    } else {
      handleSelect(
        activeSuggestion.description,
        activeSuggestion.placeId,
        activeSuggestion
      );
    }
  };
  const handleUpKey = () => {
    if (suggestions.length === 0) {
      return;
    }

    const activeSuggestion = getActiveSuggestion();
    if (activeSuggestion === undefined) {
      selectActiveAtIndex(suggestions.length - 1);
    } else if (activeSuggestion.index === 0) {
      selectUserInputValue();
    } else {
      selectActiveAtIndex(activeSuggestion.index - 1);
    }
  };
  const handleDownKey = () => {
    if (suggestions.length === 0) {
      return;
    }

    const activeSuggestion = getActiveSuggestion();
    if (activeSuggestion === undefined) {
      selectActiveAtIndex(0);
    } else if (activeSuggestion.index === suggestions.length - 1) {
      selectUserInputValue();
    } else {
      selectActiveAtIndex(activeSuggestion.index + 1);
    }
  };
  const handleInputKeyDown = event => {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        handleEnterKey();
        break;
      case "ArrowDown":
        event.preventDefault(); // prevent the cursor from moving
        handleDownKey();
        break;
      case "ArrowUp":
        event.preventDefault(); // prevent the cursor from moving
        handleUpKey();
        break;
      case "Escape":
        clearSuggestions();
        break;
    }
  };
  const handleInputChange = event => {
    const { value } = event.target;
    onChange(value);
    setUserInputValue(value);
    if (!value) {
      clearSuggestions();
      return;
    }
    if (shouldFetchSuggestions) {
      debouncedFetchPredictions({
        value,
        searchOptions,
        setLoading,
        autocompleteCallback,
        onError,
        clearSuggestions
      });
    }
  };
  const handleInputOnBlur = () => {
    if (!mousedownOnSuggestion) {
      clearSuggestions();
    }
  };

  const getIsExpanded = () => {
    return suggestions.length > 0;
  };

  const compose = (...fns) => (...args) => {
    fns.forEach(fn => fn && fn(...args));
  };

  const getInputProps = (options = {}) => {
    const defaultInputProps = {
      type: "text",
      autoComplete: "off",
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-expanded": getIsExpanded(),
      "aria-activedescendant": getActiveSuggestionId(),
      disabled: !ready
    };

    return {
      ...defaultInputProps,
      ...options,
      onKeyDown: compose(handleInputKeyDown, options.onKeyDown),
      onBlur: compose(handleInputOnBlur, options.onBlur),
      value,
      onChange: event => {
        handleInputChange(event);
      }
    };
  };

  const handleSuggestionMouseEnter = function(index) {
    setActiveAtIndex(index);
  };
  const handleSuggestionMouseLeave = () => {
    setMousedownOnSuggestion(false);
    clearActive();
  };
  const handleSuggestionClick = function(suggestion, event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    const { description, placeId } = suggestion;
    handleSelect(description, placeId, suggestion);
    setTimeout(() => {
      setMousedownOnSuggestion(false);
    });
  };
  const handleSuggestionMouseDown = event => {
    event.preventDefault();
    setMousedownOnSuggestion(true);
  };
  const handleSuggestionMouseUp = () => {
    setMousedownOnSuggestion(false);
  };
  const handleSuggestionTouchStart = () => {
    setMousedownOnSuggestion(true);
  };

  const getSuggestionItemProps = (suggestion, options = {}) => {
    const handleSuggestionMouseEnterCurry = handleSuggestionMouseEnter.bind(
      undefined,
      suggestion.index
    );
    const handleSuggestionClickCurry = handleSuggestionClick.bind(
      undefined,
      suggestion
    );

    return {
      ...options,
      key: suggestion.id,
      id: getActiveSuggestionId(),
      role: "option",
      onMouseEnter: compose(
        handleSuggestionMouseEnterCurry,
        options.onMouseEnter
      ),
      onMouseLeave: compose(handleSuggestionMouseLeave, options.onMouseLeave),
      onMouseDown: compose(handleSuggestionMouseDown, options.onMouseDown),
      onMouseUp: compose(handleSuggestionMouseUp, options.onMouseUp),
      onTouchStart: compose(handleSuggestionTouchStart, options.onTouchStart),
      onTouchEnd: compose(handleSuggestionMouseUp, options.onTouchEnd),
      onClick: compose(handleSuggestionClickCurry, options.onClick)
    };
  };

  return children({
    getInputProps,
    getSuggestionItemProps,
    loading,
    suggestions
  });
};

Autocomplete.defaultProps = {
  onError: (status, _clearSuggestions) =>
    console.error(
      "[autocomplete]: error happened when fetching data from Geocode API.\nStatus: ",
      status
    ),
  debounceValue: 200,
  highlightFirstSuggestion: false,
  shouldFetchSuggestions: true
};

export default Autocomplete;
