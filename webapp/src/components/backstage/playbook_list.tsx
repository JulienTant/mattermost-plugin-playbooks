// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getMyTeams} from 'mattermost-redux/selectors/entities/teams';
import {GlobalState} from 'mattermost-redux/types/store';
import {Team} from 'mattermost-redux/types/teams';
import React, {useRef, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import styled from 'styled-components';

import {displayPlaybookCreateModal} from 'src/actions';
import {PrimaryButton, UpgradeButtonProps} from 'src/components/assets/buttons';
import LeftDots from 'src/components/assets/left_dots';
import LeftFade from 'src/components/assets/left_fade';
import NoContentPlaybookSvg from 'src/components/assets/no_content_playbooks_svg';
import RightDots from 'src/components/assets/right_dots';
import RightFade from 'src/components/assets/right_fade';
import BackstageListHeader from 'src/components/backstage/backstage_list_header';
import PlaybookListRow from 'src/components/backstage/playbook_list_row';
import {ExpandRight, HorizontalSpacer} from 'src/components/backstage/playbook_runs/shared';
import SearchInput from 'src/components/backstage/search_input';
import {BackstageSubheader} from 'src/components/backstage/styles';
import TemplateSelector, {
    isPlaybookCreationAllowed,
} from 'src/components/backstage/template_selector';
import UpgradeModal from 'src/components/backstage/upgrade_modal';
import {PaginationRow} from 'src/components/pagination_row';
import {SortableColHeader} from 'src/components/sortable_col_header';
import {AdminNotificationType, BACKSTAGE_LIST_PER_PAGE} from 'src/constants';
import {
    useAllowPlaybookCreationInTeams,
    useCanCreatePlaybooksOnAnyTeam,
    usePlaybooksCrud,
    usePlaybooksRouting,
} from 'src/hooks';
import {Playbook} from 'src/types/playbook';

import useConfirmPlaybookArchiveModal from './archive_playbook_modal';

const PlaybooksHeader = styled(BackstageSubheader)`
    display: flex;
    padding: 4rem 0 3.2rem;
`;

const ContainerMedium = styled.div`
    margin: 0 auto;
    max-width: 1160px;
    padding: 0 20px;
`;

const PlaybookContainer = styled.div`
    font-family: $font-family;
    color: rgba(var(--center-channel-color-rgb), 0.90);
`;

const PlaybookList = () => {
    const {formatMessage} = useIntl();
    const [confirmArchiveModal, openConfirmArchiveModal] = useConfirmPlaybookArchiveModal();
    const canCreatePlaybooks = useCanCreatePlaybooksOnAnyTeam();
    const [isUpgradeModalShown, showUpgradeModal, hideUpgradeModal] = useUpgradeModalVisibility(false);
    const allowPlaybookCreationInTeams = useAllowPlaybookCreationInTeams();
    const teams = useSelector<GlobalState, Team[]>(getMyTeams);
    const bottomHalf = useRef<JSX.Element | null>(null);
    const dispatch = useDispatch();

    const [
        playbooks,
        {isLoading, totalCount, params, selectedPlaybook},
        {setPage, sortBy, setSelectedPlaybook, archivePlaybook, setSearchTerm, isFiltering},
    ] = usePlaybooksCrud({team_id: '', per_page: BACKSTAGE_LIST_PER_PAGE});

    const {view, edit} = usePlaybooksRouting<Playbook>({onGo: setSelectedPlaybook});

    const newPlaybook = (team: Team, templateTitle?: string) => {
        dispatch(displayPlaybookCreateModal({startingTeamId: team.id, startingTemplate: templateTitle}));
    };

    const hasPlaybooks = playbooks?.length !== 0;
    let listBody: JSX.Element | JSX.Element[] | null = null;
    if (!hasPlaybooks && isFiltering) {
        listBody = (
            <div className='text-center pt-8'>
                <FormattedMessage defaultMessage='There are no playbooks matching those filters.'/>
            </div>
        );
    } else if (playbooks) {
        listBody = playbooks.map((p: Playbook) => (
            <PlaybookListRow
                key={p.id}
                playbook={p}
                displayTeam={teams.length > 1}
                onClick={() => view(p)}
                onEdit={() => edit(p)}
                onArchive={() => openConfirmArchiveModal(p)}
            />
        ));
    }

    const makeBottomHalf = () => {
        if (!hasPlaybooks && !isFiltering) {
            return (
                <>
                    <NoContentPage
                        canCreatePlaybooks={canCreatePlaybooks}
                        allowPlaybookCreationInTeams={allowPlaybookCreationInTeams}
                    />
                    <NoContentPlaybookSvg/>
                </>
            );
        }

        return (
            <>
                <RightDots/>
                <RightFade/>
                <LeftDots/>
                <LeftFade/>
                <ContainerMedium>
                    <PlaybooksHeader data-testid='titlePlaybook'>
                        <FormattedMessage defaultMessage='Playbooks'/>
                        <ExpandRight/>
                        <SearchInput
                            testId={'search-filter'}
                            default={params.search_term}
                            onSearch={setSearchTerm}
                            placeholder={formatMessage({defaultMessage: 'Search for a playbook'})}
                        />
                        {canCreatePlaybooks &&
                        <>
                            <HorizontalSpacer size={12}/>
                            <PlaybookModalButton
                                allowPlaybookCreationInTeams={allowPlaybookCreationInTeams}
                                showUpgradeModal={showUpgradeModal}
                            />
                        </>
                        }
                    </PlaybooksHeader>
                    <BackstageListHeader>
                        <div className='row'>
                            <div className='col-sm-4'>
                                <SortableColHeader
                                    name={formatMessage({defaultMessage: 'Name'})}
                                    direction={params.direction}
                                    active={params.sort === 'title'}
                                    onClick={() => sortBy('title')}
                                />
                            </div>
                            <div className='col-sm-2'>
                                <SortableColHeader
                                    name={formatMessage({defaultMessage: 'Checklists'})}
                                    direction={params.direction}
                                    active={params.sort === 'stages'}
                                    onClick={() => sortBy('stages')}
                                />
                            </div>
                            <div className='col-sm-2'>
                                <SortableColHeader
                                    name={'Tasks'}
                                    direction={params.direction}
                                    active={params.sort === 'steps'}
                                    onClick={() => sortBy('steps')}
                                />
                            </div>
                            <div className='col-sm-2'>
                                <SortableColHeader
                                    name={formatMessage({defaultMessage: 'Runs'})}
                                    direction={params.direction}
                                    active={params.sort === 'runs'}
                                    onClick={() => sortBy('runs')}
                                />
                            </div>
                            <div className='col-sm-2'>
                                <FormattedMessage defaultMessage='Actions'/>
                            </div>
                        </div>
                    </BackstageListHeader>
                    {listBody}
                    <PaginationRow
                        page={params.page}
                        perPage={params.per_page}
                        totalCount={totalCount}
                        setPage={setPage}
                    />
                </ContainerMedium>
            </>
        );
    };

    // If we don't have a bottomHalf, create it. Or if we're loading new playbooks, use the previous body.
    if (!bottomHalf.current || !isLoading) {
        bottomHalf.current = makeBottomHalf();
    }

    return (
        <PlaybookContainer>
            {
                canCreatePlaybooks &&
                <TemplateSelector
                    allowPlaybookCreationInTeams={allowPlaybookCreationInTeams}
                    showUpgradeModal={showUpgradeModal}
                />
            }
            {bottomHalf.current}
            <UpgradeModal
                messageType={AdminNotificationType.PLAYBOOK}
                show={isUpgradeModalShown}
                onHide={hideUpgradeModal}
            />
            {confirmArchiveModal}
        </PlaybookContainer>
    );
};

type PlaybookModalButtonProps = UpgradeButtonProps & {allowPlaybookCreationInTeams:Map<string, boolean>, showUpgradeModal?: () => void};

const PlaybookModalButton = (props: PlaybookModalButtonProps) => {
    const {formatMessage} = useIntl();
    const {allowPlaybookCreationInTeams, showUpgradeModal} = props;
    const dispatch = useDispatch();
    if (isPlaybookCreationAllowed(allowPlaybookCreationInTeams)) {
        return (
            <CreatePlaybookButton
                onClick={() => dispatch(displayPlaybookCreateModal({}))}
            >
                <i className='icon-plus mr-2'/>
                {formatMessage({defaultMessage: 'Create playbook'})}
            </CreatePlaybookButton>
        );
    }
    return (
        <CreatePlaybookButton
            onClick={showUpgradeModal}
        >
            <i className='icon-plus mr-2'/>
            {formatMessage({defaultMessage: 'Create playbook'})}
            <NotAllowedIcon className='icon icon-key-variant-circle'/>
        </CreatePlaybookButton>
    );
};

const CreatePlaybookButton = styled(PrimaryButton)`
    display: flex;
    align-items: center;
`;

const NotAllowedIcon = styled.i`
    color: var(--online-indicator);
    position: absolute;
    top: -4px;
    right: -6px;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
`;

export const useUpgradeModalVisibility = (initialState: boolean): [boolean, () => void, () => void] => {
    const [isModalShown, setShowModal] = useState(initialState);

    const showUpgradeModal = () => {
        setShowModal(true);
    };
    const hideUpgradeModal = () => {
        setShowModal(false);
    };

    return [isModalShown, showUpgradeModal, hideUpgradeModal];
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 20px;
`;

const Title = styled.h2`
    padding-top: 110px;
    font-family: Open Sans;
    font-style: normal;
    font-weight: normal;
    font-size: 28px;
    color: var(--center-channel-color);
    text-align: center;
`;

const Description = styled.h5`
    font-family: Open Sans;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 24px;
    color: rgba(var(--center-channel-color-rgb), 0.72);
    text-align: center;
    max-width: 800px;
`;

const DescriptionWarn = styled(Description)`
    color: rgba(var(--error-text-color-rgb), 0.72);
`;

const NoContentPage = (props: { canCreatePlaybooks: boolean, allowPlaybookCreationInTeams: Map<string, boolean> }) => {
    return (
        <Container>
            <Title><FormattedMessage defaultMessage='What is a playbook?'/></Title>
            <Description>
                <FormattedMessage
                    defaultMessage='A playbook is a workflow that your teams and tools should follow, including everything from checklists, actions, templates, and retrospectives.'
                />
            </Description>
            {props.canCreatePlaybooks &&
            <PlaybookModalButton
                className='mt-6'
                allowPlaybookCreationInTeams={props.allowPlaybookCreationInTeams}
            />
            }
            {!props.canCreatePlaybooks &&
            <DescriptionWarn>
                <FormattedMessage
                    defaultMessage="There are no playbooks to view. You don't have permission to create playbooks in this workspace."
                />
            </DescriptionWarn>
            }
        </Container>
    );
};

export default PlaybookList;
