'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { useForkRef } from '@base-ui-components/react/utils';
import { ChevronDown } from 'lucide-react';
import { Menubar } from '@base-ui-components/react/menubar';
import { ViewType } from '../../models/views';
import { useTranslations } from '../../internals/utils/TranslationsContext';
import { useEventCalendarStore } from '../../internals/hooks/useEventCalendarStore';
import { useSelector } from '../../../base-ui-copy/utils/store';
import { selectors } from '../../event-calendar/store';
import './ViewSwitcher.css';

export const ViewSwitcher = React.forwardRef(function ViewSwitcher(
  props: React.HTMLAttributes<HTMLDivElement>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, ...other } = props;

  const store = useEventCalendarStore();
  const views = useSelector(store, selectors.views);
  const currentView = useSelector(store, selectors.currentView);

  const containerRef = React.useRef<HTMLElement | null>(null);
  const handleRef = useForkRef(forwardedRef, containerRef);
  const translations = useTranslations();

  const handleSelectView = React.useCallback(
    (view: ViewType) => store.set('currentView', view),
    [store],
  );

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const view = event.currentTarget.getAttribute('data-view');
      if (view) {
        handleSelectView(view as ViewType);
      }
    },
    [handleSelectView],
  );

  const showAll = views.length <= 3;
  const visible = showAll ? views : views.slice(0, 2);
  const dropdown = showAll ? [] : views.slice(2);
  const currentOverflowView = dropdown.includes(currentView) ? currentView : null;
  const dropdownLabel = currentOverflowView
    ? translations[currentOverflowView]
    : translations.other;

  return (
    <div ref={handleRef} className={clsx('ViewSwitcherContainer', className)} {...other}>
      <Menubar className="ViewSwitcherMenuBar">
        {visible.map((view) => (
          <button
            key={view}
            className="ViewSwitcherMainItem"
            onClick={handleClick}
            data-view={view}
            type="button"
            data-pressed={currentView === view || undefined}
            aria-pressed={currentView === view}
          >
            {translations[view]}
          </button>
        ))}
        {dropdown.length > 0 && (
          <Menu.Root>
            <Menu.Trigger
              className="ViewSwitcherMainItem"
              data-view="other"
              data-highlighted={dropdown.includes(currentView) || undefined}
            >
              {dropdownLabel} <ChevronDown size={16} strokeWidth={2} />
            </Menu.Trigger>
            <Menu.Portal container={containerRef}>
              <Menu.Positioner
                className="ViewSwitcherMenuPositioner"
                sideOffset={9}
                align="end"
                alignOffset={-4}
              >
                <Menu.Popup className="ViewSwitcherMenuPopup">
                  <Menu.RadioGroup
                    value={currentView}
                    onValueChange={handleSelectView}
                    className="ViewSwitcherRadioGroup"
                  >
                    {dropdown.map((view) => (
                      <Menu.RadioItem
                        key={view}
                        className="ViewSwitcherRadioItem"
                        value={view}
                        closeOnClick
                      >
                        {translations[view]}
                      </Menu.RadioItem>
                    ))}
                  </Menu.RadioGroup>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        )}
      </Menubar>
    </div>
  );
});
