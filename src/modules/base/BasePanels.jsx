import React from 'react';

import TabbedPanel from '@flapjs/components/panel/TabbedPanel.jsx';
import IconTab from '@flapjs/components/panel/IconTab.jsx';
import { RunningManIcon, WrenchIcon, BarChartIcon } from '@flapjs/components/icons/Icons.js';

export default [
    <TabbedPanel key="0" title="About me"
        renderTab={(callback, props) => <IconTab key="0" onClick={callback} iconClass={RunningManIcon} {...props}/>}
        renderPanel={() => 'Panel 1'}/>,
    <TabbedPanel key="1" title="Something"
        renderTab={(callback, props) => <IconTab key="1" onClick={callback} iconClass={WrenchIcon} {...props}/>}
        renderPanel={() => 'Panel 2'}/>,
    <TabbedPanel key="2" title="Else"
        renderTab={(callback, props) => <IconTab key="2" onClick={callback} iconClass={BarChartIcon} {...props}/>}
        renderPanel={() => 'Panel 3'}/>,
];
