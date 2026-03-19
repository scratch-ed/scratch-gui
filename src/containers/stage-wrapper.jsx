import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import {STAGE_DISPLAY_SIZES} from '../lib/layout-constants.js';
import StageWrapperComponent from '../components/stage-wrapper/stage-wrapper.jsx';

const StageWrapper = props => <StageWrapperComponent {...props} />;

StageWrapper.propTypes = {
    isRendererSupported: PropTypes.bool.isRequired,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    vm: PropTypes.instanceOf(VM).isRequired,
    heatmapVisible: PropTypes.bool,
    spritePositions: PropTypes.arrayOf(PropTypes.object)
};

const mapStateToProps = state => ({
    heatmapVisible: state.scratchGui.timeSlider.heatmapVisible,
    spritePositions: state.scratchGui.timeSlider.spritePositions || []
});

export default connect(mapStateToProps)(StageWrapper);
