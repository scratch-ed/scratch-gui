import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styles from './broadcast-flowchart.css';

const getBracketsElement = element => `["${element}"]`;

const createFlowchartScript = (direction, allTargets, broadcastEvent) => {
    const arrowReact = '-->';
    const arrowCross = '--x';
    const broadcastId = 'Broadcast';
    const classReact = 'Aqua';
    const classCross = 'Rose';

    const classDefReact = `classDef ${classReact} stroke-width:1px, stroke-dasharray:none, stroke:#46EDC8, fill:#DEFFF8, color:#378E7A\n`;
    const classDefCross = `classDef ${classCross} stroke-width:1px, stroke-dasharray:none, stroke:#FF5978, fill:#FFDFE5, color:#8E2236\n`;

    let id = 1;
    const reacted = new Set(broadcastEvent["sprites"]);

    // Combine all targets with their reaction status, then sort by name
    const allTargetsWithStatus = allTargets.map(target => ({
        name: target,
        reacted: reacted.has(target)
    })).sort((a, b) => a.name.localeCompare(b.name));

    const flowchartInit = `flowchart ${direction}\n`;
    const flowchartStart = `${id}${getBracketsElement(broadcastEvent.data.source)}${arrowReact} ${broadcastId}{"${broadcastEvent.data.name.toLowerCase()}"}\n`;

    id++;
    const flowchartConnections = [];
    const classes = [];

    for (const target of allTargetsWithStatus) {
        const arrow = target.reacted ? arrowReact : arrowCross;
        const className = target.reacted ? classReact : classCross;
        flowchartConnections.push(`${broadcastId} ${arrow} ${id}${getBracketsElement(target.name)}`);
        classes.push(`${id}:::${className}`);
        id++;
    }

    return flowchartInit + flowchartStart + flowchartConnections.join('\n')
            + '\n' + classes.join('\n') + '\n' + classDefReact + classDefCross;
};

const BroadcastFlowchart = ({ broadcastEvent, sprites, stage, onClose }) => {
    const allSprites = Object.values(sprites).map(sprite => sprite.name);
    const stageName = stage.name || 'Stage';
    const allTargets = [...allSprites, stageName];
    const mermaidRef = useRef(null);
    const containerRef = useRef(null);
    const diagramId = `mermaid-diagram-${Date.now()}`;

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const handleMouseDown = e => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = e => {
        if (!isDragging) return;

        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (window.mermaid && broadcastEvent && allTargets) {
            const flowchartScript = createFlowchartScript('TB', allTargets, broadcastEvent);

            if (mermaidRef.current) {
                mermaidRef.current.innerHTML = '';

                const diagramDiv = document.createElement('div');
                diagramDiv.className = 'mermaid';
                diagramDiv.id = diagramId;
                diagramDiv.textContent = flowchartScript;
                mermaidRef.current.appendChild(diagramDiv);

                try {
                    window.mermaid.initialize({
                        startOnLoad: false,
                        theme: 'default',
                        securityLevel: 'loose',
                        flowchart: {
                            useMaxWidth: false,
                            htmlLabels: true,
                            padding: 5
                        }
                    });
                    window.mermaid.run();
                } catch (error) {
                    console.error('Error rendering Mermaid diagram:', error);
                }
            }
        }
    }, [broadcastEvent, allTargets, diagramId]);

    useEffect(() => {
        const handleGlobalMouseMove = e => handleMouseMove(e);
        const handleGlobalMouseUp = () => handleMouseUp();

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dragStart]);

    if (!broadcastEvent || !allTargets) {
        return (
            <div className={styles.container}>
                <div className={styles.placeholder}>
                    Select a broadcast event to view the flowchart
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h3 className={styles.title}>Broadcast visualisation from timestamp {broadcastEvent.timestamp}</h3>
                </div>
                <div className={styles.headerRight}>
                    <button onClick={handleClose} className={styles.closeButton}>×</button>
                </div>
            </div>
            <div
                className={`${styles.diagramContainer} ${isDragging ? styles.dragging : ''}`}
                ref={containerRef}
                onMouseDown={handleMouseDown}
            >
                <div
                    className={`${styles.diagramWrapper} ${isDragging ? styles.dragging : ''}`}
                    ref={mermaidRef}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                />
            </div>
        </div>
    );
};

BroadcastFlowchart.propTypes = {
    broadcastEvent: PropTypes.shape({
        data: PropTypes.shape({
            name: PropTypes.string.isRequired,
            source: PropTypes.string.isRequired,
        }).isRequired,
        sprites: PropTypes.arrayOf(PropTypes.string).isRequired,
        timestamp: PropTypes.number.isRequired,
    }),
    // eslint-disable-next-line react/forbid-prop-types
    sprites: PropTypes.object,
    // eslint-disable-next-line react/forbid-prop-types
    stage: PropTypes.object,
    onClose: PropTypes.func
};

const mapStateToProps = state => ({
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage
});

export default connect(mapStateToProps)(BroadcastFlowchart);
