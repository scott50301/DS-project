if (!this.seantis) this.seantis = {};
if (!this.seantis.wizard) this.seantis.wizard = {};

(function($) {
    seantis.wizard.init = function() {

        /* on seantis reservation forms */
        var form = $('form.seantis-reservation-form');
        if (form.length === 0) {
            return;
        }

        form.find('.formTabs').addClass('wizardSteps');

        var enable_next_next = form.hasClass('next-next-wizard');

        /* if there is more than a single tab */
        var tabs = form.find('.formTab');
        if (tabs.length <= 1) {
            return;
        }

        for (var i=0; i< tabs.length; i++) {
            $(tabs[i]).data('wizard-step', i);
        }

        var submit = form.find('input.context');
        var current_tab = $(tabs[0]);
        current_tab.click();

        /* highlight visited tabs */
        tabs.find('a').click(function() {
            current_tab = $(this).parent();

            $(tabs).removeClass('selected');
            $(tabs).find('a').removeClass('selected');

            current_tab.addClass('visited');
            current_tab.addClass('selected');
            current_tab.find('a').addClass('selected');

            if (enable_next_next) {
                if (current_tab.hasClass('lastFormTab')) {
                    submit.val(seantis.locale('reserve'));
                } else {
                    submit.val(seantis.locale('continue'));
                }
            }
        });

        /* and submit on the last tab only, showing next->next until then*/
        if (enable_next_next) {
            submit.click(function(e) {
                if (current_tab.hasClass('lastFormTab')) {
                    return; // do submit
                }

                var nextstep = current_tab.data('wizard-step') + 1;
                $(tabs[nextstep]).find('a').click();

                /* focus the first element of the form to ensure that the
                browser scrolls to it in long forms */
                var fieldset = form.find(
                     'fieldset[data-fieldset=' + parseInt(nextstep-1, 10) + ']'
                );
                fieldset.find('input[type!="hidden"]').first().focus();

                e.preventDefault();
            });
        }

        /* ensure correct classes on (re)load */
        $(tabs).removeClass('visited');
        $(tabs).find('a').removeClass('selected');
        $(tabs[0]).addClass('selected visited');

        if (enable_next_next) {
            submit.val(seantis.locale('continue'));
        }

        /* after ajax reloading the first tab is sometimes unselected */
        current_tab.find('a').click();

        /* select the first tab with an error in it */

        var fieldsets = form.find('fieldset');
        for (var j=0; j<fieldsets.length; j++) {
            if ($(fieldsets[j]).find('.fieldErrorBox .error').length > 0) {
                $(tabs[j]).find('a').click();
                break;
            }
        }
    };
})(jQuery);