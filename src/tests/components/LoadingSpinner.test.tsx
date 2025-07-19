import React from 'react';
import { render } from '../utils/testUtils';
import { LoadingSpinner } from '../../components/common';

describe('LoadingSpinner', () => {
  it('renders correctly with default props', () => {
    const { getByTestId } = render(<LoadingSpinner />);
    
    const spinner = getByTestId('loading-spinner');
    expect(spinner).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { getByTestId } = render(<LoadingSpinner size="large" />);
    
    const spinner = getByTestId('loading-spinner');
    expect(spinner).toBeTruthy();
  });

  it('renders with custom color', () => {
    const { getByTestId } = render(<LoadingSpinner color="#FF0000" />);
    
    const spinner = getByTestId('loading-spinner');
    expect(spinner).toBeTruthy();
  });

  it('renders with text', () => {
    const { getByText } = render(<LoadingSpinner text="Loading..." />);
    
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('does not render text when not provided', () => {
    const { queryByText } = render(<LoadingSpinner />);
    
    expect(queryByText('Loading...')).toBeNull();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(<LoadingSpinner style={customStyle} />);
    
    const container = getByTestId('loading-spinner-container');
    expect(container).toBeTruthy();
  });
});

