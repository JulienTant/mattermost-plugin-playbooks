// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useDispatch} from 'react-redux';
import styled, {css} from 'styled-components';
import {DateTime} from 'luxon';
import Icon from '@mdi/react';
import {mdiFlagCheckered} from '@mdi/js';

import {FormattedMessage} from 'react-intl';

import {promptUpdateStatus} from 'src/actions';
import RHSPostUpdateButton from 'src/components/rhs/rhs_post_update_button';
import Exclamation from 'src/components/assets/icons/exclamation';
import {PlaybookRun, PlaybookRunStatus} from 'src/types/playbook_run';
import Clock from 'src/components/assets/icons/clock';

import {useNow} from 'src/hooks';

interface Props {
    collapsed: boolean;
    playbookRun: PlaybookRun;
    updatesExist: boolean;
}

const RHSPostUpdate = (props: Props) => {
    const dispatch = useDispatch();
    const fiveSeconds = 5000;
    const now = useNow(fiveSeconds);

    //@ts-ignore
    const Timestamp = window.Components?.Timestamp;
    if (!Timestamp) {
        return null;
    }

    const isNextUpdateScheduled = props.playbookRun.previous_reminder !== 0;
    const timestamp = getTimestamp(props.playbookRun, isNextUpdateScheduled);
    const isDue = isNextUpdateScheduled && timestamp < now;
    const isFinished = props.playbookRun.current_status === PlaybookRunStatus.Finished;

    let pretext = <FormattedMessage defaultMessage='Last update'/>;
    if (isFinished) {
        pretext = <FormattedMessage defaultMessage='Run finished'/>;
    } else if (isNextUpdateScheduled) {
        pretext = (isDue ? <FormattedMessage defaultMessage='Update overdue'/> : <FormattedMessage defaultMessage='Update due'/>);
    }

    const timespec = (isDue || !isNextUpdateScheduled) ? PastTimeSpec : FutureTimeSpec;

    let icon: JSX.Element;
    if (isFinished) {
        icon = (
            <Icon
                path={mdiFlagCheckered}
                size={2.6}
            />
        );
    } else if (isDue) {
        icon = <Exclamation/>;
    } else {
        icon = <Clock/>;
    }

    return (
        <PostUpdate
            collapsed={props.collapsed}
            id={'rhs-post-update'}
        >
            {(props.updatesExist || isNextUpdateScheduled || isFinished) &&
            <>
                <Timer>
                    <IconWrapper collapsed={props.collapsed}>
                        {icon}
                    </IconWrapper>
                    <UpdateNotice
                        collapsed={props.collapsed}
                        isDue={isDue}
                    >
                        <UpdateNoticePretext>
                            {pretext}
                        </UpdateNoticePretext>
                        <UpdateNoticeTime collapsed={props.collapsed}>
                            <Timestamp
                                value={timestamp.toJSDate()}
                                units={timespec}
                                useTime={false}
                            />
                        </UpdateNoticeTime>
                    </UpdateNotice>
                </Timer>
                <Spacer/>
            </>
            }
            <RHSPostUpdateButton
                collapsed={props.collapsed}
                isNextUpdateScheduled={isNextUpdateScheduled}
                updatesExist={props.updatesExist}
                disabled={props.playbookRun.current_status === PlaybookRunStatus.Finished}
                onClick={() => {
                    dispatch(promptUpdateStatus(
                        props.playbookRun.team_id,
                        props.playbookRun.id,
                        props.playbookRun.channel_id,
                    ));
                }}
                isDue={isDue}
            />
        </PostUpdate>
    );
};

const getTimestamp = (playbookRun: PlaybookRun, isNextUpdateScheduled: boolean) => {
    let timestampValue = playbookRun.last_status_update_at;

    if (playbookRun.current_status === PlaybookRunStatus.Finished) {
        timestampValue = playbookRun.end_at;
    } else if (isNextUpdateScheduled) {
        const previousReminderMillis = Math.floor(playbookRun.previous_reminder / 1e6);
        timestampValue = playbookRun.last_status_update_at + previousReminderMillis;
    }

    return DateTime.fromMillis(timestampValue);
};

export const PastTimeSpec = [
    {within: ['second', -45], display: <FormattedMessage defaultMessage='just now'/>},
    ['minute', -59],
    ['hour', -48],
    ['day', -30],
    ['month', -12],
    'year',
];

export const FutureTimeSpec = [
    ['minute', 59],
    ['hour', 48],
    ['day', 30],
    ['month', 12],
    'year',
];

interface CollapsedProps {
    collapsed: boolean;
}

const PostUpdate = styled.div<CollapsedProps>`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;

    justify-content: space-between;
    padding: ${(props) => (props.collapsed ? '8px 8px 8px 12px' : '12px')};

    background-color: var(--center-channel-bg);

    border: 1px solid rgba(var(--center-channel-color-rgb), 0.08);
    border-radius: 4px;
`;

const Timer = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    align-items: center
`;

const IconWrapper = styled.span<CollapsedProps>`
    display: flex;
    justify-content: center;
    align-items: center;

    width: ${(props) => (props.collapsed ? '14px' : '48px')};
`;

const UpdateNotice = styled.div<CollapsedProps & {isDue: boolean}>`
    display: flex;
    flex-direction: ${(props) => (props.collapsed ? 'row' : 'column')};
    margin-left: 4px;
    padding: 0;
    color: ${(props) => (props.isDue ? 'var(--dnd-indicator)' : 'rgba(var(--center-channel-color-rgb), 0.72)')};

    font-size: 12px;
    line-height: 16px;
`;

const UpdateNoticePretext = styled.div`
    font-weight: 400;
    margin-right: 3px;
`;

const UpdateNoticeTime = styled.div<CollapsedProps>`
    font-weight: 600;

    ${(props) => !props.collapsed && css`
        font-size: 16px;
        line-height: 24px;
    `}
`;

const Spacer = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: 44px;
`;

export default RHSPostUpdate;
