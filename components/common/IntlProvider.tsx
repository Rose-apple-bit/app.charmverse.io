import { ReactNode, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { getMessages } from 'components/common/BoardEditor/focalboard/src/i18n';
import { fetchLanguage, getLanguage } from 'components/common/BoardEditor/focalboard/src/store/language';

export default function IntlProviderComponent ({ children }: { children: ReactNode }) {

  const language = useAppSelector<string>(getLanguage);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchLanguage());
  }, []);

  return (
    <IntlProvider
      locale={language.split(/[_]/)[0]}
      messages={getMessages(language)}
    >
      {children}
    </IntlProvider>
  );
}
